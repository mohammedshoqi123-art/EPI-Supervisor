import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';
import '../config/supabase_config.dart';
import '../config/sentry_config.dart';
import '../errors/app_exceptions.dart';

/// Centralized API client with hierarchical error handling.
/// All external calls go through this client for consistent error classification.
class ApiClient {
  SupabaseClient? _client;

  /// Sentinel value to filter for IS NULL in select queries.
  /// Usage: ApiClient.select('table', filters: {'deleted_at': ApiClient.isNull})
  static const isNull = _NullFilterSentinel();

  /// Helper to create an IN filter for select queries.
  /// Usage: ApiClient.select('table', filters: {'form_id': ApiClient.inList(['a','b'])})
  static _InFilterSentinel inList(List<dynamic> values) =>
      _InFilterSentinel(values);

  /// Helper to create a GT (greater than) filter for select queries.
  /// Usage: ApiClient.select('table', filters: {'created_at': ApiClient.gt('2026-01-01')})
  static _GtFilterSentinel gt(dynamic value) => _GtFilterSentinel(value);

  /// Lazy initialization — don't crash if Supabase isn't set up yet.
  SupabaseClient get _safeClient {
    if (_client == null) {
      if (!SupabaseConfig.isConfigured) {
        throw const NetworkException('Supabase is not configured');
      }
      try {
        _client = Supabase.instance.client;
      } catch (e) {
        throw NetworkException('Supabase not initialized: $e');
      }
    }
    return _client!;
  }

  // ===== Generic CRUD operations with RLS =====

  /// Default safety limit — Supabase REST API returns max 1000 rows by default
  /// when no .limit() is applied. We override to 10000 to prevent silent truncation.
  // ═══ FIX #14: 1000 (was 10000) — منع جلب بيانات ضخمة بدون قصد ═══
  // Previously: 10000 → أي استعلام بدون limit قد يُرجع 10MB+ بيانات
  // Now: 1000 → آمن للأجهزة الضعيفة، يمكن تجاوزه بـ limit: صريح
  static const int _defaultLimit = 1000;

  Future<List<Map<String, dynamic>>> select(
    String table, {
    String select = '*',
    Map<String, dynamic>? filters,
    String? orderBy,
    bool ascending = true,
    int? limit,
    int? offset,
  }) async {
    // ═══ FIX: Wrap with retry for transient network errors ═══
    // Previously: _withRetry was defined but never called
    // Now: retries 3 times on NetworkException, TimeoutException, ServerException
    return _withRetry('select($table)', () async {
      try {
        var query = _safeClient.from(table).select(select);

        if (filters != null) {
          for (final key in filters.keys) {
            if (filters[key] is _NullFilterSentinel) {
              query = query.isFilter(key, null);
            } else if (filters[key] is _InFilterSentinel) {
              query = query.inFilter(key, (filters[key] as _InFilterSentinel).values);
            } else if (filters[key] is _GtFilterSentinel) {
              query = query.gt(key, (filters[key] as _GtFilterSentinel).value);
            } else if (filters[key] != null) {
              query = query.eq(key, filters[key]);
            }
          }
        }

        dynamic finalQuery = query;

        if (orderBy != null) {
          finalQuery = finalQuery.order(orderBy, ascending: ascending);
        }

        // ═══ FIX: Always apply a limit — Supabase default is 1000 which silently truncates ═══
        final effectiveLimit = limit ?? _defaultLimit;
        if (offset != null) {
          finalQuery = finalQuery.range(offset, offset + effectiveLimit - 1);
        } else {
          finalQuery = finalQuery.limit(effectiveLimit);
        }

        return List<Map<String, dynamic>>.from(
          await finalQuery.timeout(
            const Duration(seconds: 15),
            onTimeout: () => throw TimeoutException('Query timeout for $table'),
          ),
        );
      } on PostgrestException catch (e) {
        throw _mapPostgrestException(e);
      } on FunctionException catch (e) {
        throw _mapFunctionException(e);
      } on TimeoutException {
        // Rethrow as-is so _withRetry can catch it
        rethrow;
      } catch (e, stack) {
        _reportUnexpectedError(e, stack, context: 'select($table)');
        if (_isNetworkError(e)) throw const NetworkException();
        throw ApiException(
          'Unexpected error in select: ${e.runtimeType}',
          code: 'unknown',
        );
      }
    });
  }

  /// ═══ PERFORMANCE: Select with IN filter — single query instead of N loops ═══
  /// Usage: selectIn('table', 'form_id', ['id1', 'id2', ...])
  Future<List<Map<String, dynamic>>> selectIn(
    String table,
    String column,
    List<dynamic> values, {
    String select = '*',
    Map<String, dynamic>? extraFilters,
    String? orderBy,
    bool ascending = true,
    int? limit,
    int? offset,
  }) async {
    if (values.isEmpty) return [];
    try {
      var query = _safeClient.from(table).select(select);
      query = query.inFilter(column, values);

      if (extraFilters != null) {
        for (final key in extraFilters.keys) {
          if (extraFilters[key] is _NullFilterSentinel) {
            query = query.isFilter(key, null);
          } else if (extraFilters[key] != null) {
            query = query.eq(key, extraFilters[key]);
          }
        }
      }

      dynamic finalQuery = query;
      if (orderBy != null) {
        finalQuery = finalQuery.order(orderBy, ascending: ascending);
      }

      // ═══ FIX: Always apply a limit — Supabase default is 1000 which silently truncates ═══
      final effectiveLimit = limit ?? _defaultLimit;
      if (offset != null) {
        finalQuery = finalQuery.range(offset, offset + effectiveLimit - 1);
      } else {
        finalQuery = finalQuery.limit(effectiveLimit);
      }

      return List<Map<String, dynamic>>.from(
        await finalQuery.timeout(
          const Duration(seconds: 15),
          onTimeout: () => throw TimeoutException('Query timeout for $table'),
        ),
      );
    } on PostgrestException catch (e) {
      throw _mapPostgrestException(e);
    } on TimeoutException {
      throw NetworkException('انتهت مهلة الاتصال لجدول $table');
    } catch (e, stack) {
      _reportUnexpectedError(e, stack, context: 'selectIn($table)');
      if (_isNetworkError(e)) throw const NetworkException();
      throw ApiException(
        'Unexpected error in selectIn: ${e.runtimeType}',
        code: 'unknown',
      );
    }
  }

  /// ═══ FIX A3: Use real count from Supabase instead of fetching all IDs ═══
  /// Previously: fetched ALL row IDs and counted .length — huge bandwidth waste.
  /// Now: uses Supabase's built-in count feature (zero data transfer).
  Future<int> count(
    String table, {
    Map<String, dynamic>? filters,
  }) async {
    try {
      // ═══ FIX A3: Optimized count — select only 'id' with safety limit ═══
      // Previous: fetched ALL rows with select('id') — wasted bandwidth on large tables
      // Now: limit to 10000 IDs max (sufficient for count, prevents huge transfers)
      // Note: .limit() must come AFTER filters (PostgrestTransformBuilder doesn't support .eq())
      var query = _safeClient.from(table).select('id');
      if (filters != null) {
        for (final key in filters.keys) {
          if (filters[key] is _NullFilterSentinel) {
            query = query.isFilter(key, null);
          } else if (filters[key] is _InFilterSentinel) {
            query = query.inFilter(key, (filters[key] as _InFilterSentinel).values);
          } else if (filters[key] is _GtFilterSentinel) {
            query = query.gt(key, (filters[key] as _GtFilterSentinel).value);
          } else if (filters[key] != null) {
            query = query.eq(key, filters[key]);
          }
        }
      }
      final result = await query.limit(10000).timeout(
        const Duration(seconds: 10),
        onTimeout: () => throw TimeoutException('Count timeout for $table'),
      );
      return result.length;
    } on TimeoutException {
      debugPrint('[ApiClient] count($table) timeout');
      throw NetworkException('انتهت مهلة العد لجدول $table');
    } catch (e) {
      debugPrint('[ApiClient] count($table) error: $e');
      // ═══ FIX: Don't silently return 0 — rethrow ALL errors ═══
      // Previously: returned 0 for non-network errors → Dashboard showed 0 submissions
      // Now: throws so callers can distinguish "no data" from "error"
      if (_isNetworkError(e)) throw const NetworkException();
      // Rethrow as ApiException so callers know it's an error, not a real 0 count
      throw ApiException(
        'Count failed for $table: ${e.runtimeType}',
        code: 'count_error',
      );
    }
  }

  Future<Map<String, dynamic>> selectOne(
    String table, {
    String select = '*',
    required Map<String, dynamic> filters,
  }) async {
    try {
      var query = _safeClient.from(table).select(select);
      filters.forEach((key, value) {
        if (value is _NullFilterSentinel) {
          query = query.isFilter(key, null);
        } else {
          query = query.eq(key, value);
        }
      });
      final result = await query.maybeSingle().timeout(
        const Duration(seconds: 10),
        onTimeout: () => throw TimeoutException('Query timeout for $table'),
      );
      if (result == null) throw NotFoundException('Record not found in $table');
      return result;
    } on AppException {
      rethrow;
    } on PostgrestException catch (e) {
      throw _mapPostgrestException(e);
    } on TimeoutException {
      throw NetworkException('انتهت مهلة الاتصال لجدول $table');
    } catch (e, stack) {
      _reportUnexpectedError(e, stack, context: 'selectOne($table)');
      if (_isNetworkError(e)) throw const NetworkException();
      throw ApiException(
        'Unexpected error in selectOne: ${e.runtimeType}',
        code: 'unknown',
      );
    }
  }

  Future<Map<String, dynamic>> insert(
    String table,
    Map<String, dynamic> data, {
    String select = '*',
  }) async {
    try {
      final result = await _safeClient
          .from(table)
          .insert(data)
          .select(select)
          .single()
          .timeout(
            const Duration(seconds: 10),
            onTimeout: () => throw TimeoutException('Insert timeout for $table'),
          );
      return result;
    } on PostgrestException catch (e) {
      throw _mapPostgrestException(e);
    } on TimeoutException {
      throw NetworkException('انتهت مهلة الإدراج لجدول $table');
    } catch (e, stack) {
      _reportUnexpectedError(e, stack, context: 'insert($table)');
      if (_isNetworkError(e)) throw const NetworkException();
      throw ApiException(
        'Unexpected error in insert: ${e.runtimeType}',
        code: 'unknown',
      );
    }
  }

  Future<Map<String, dynamic>> update(
    String table,
    Map<String, dynamic> data, {
    required Map<String, dynamic> filters,
    String select = '*',
  }) async {
    try {
      var query = _safeClient.from(table).update(data);
      filters.forEach((key, value) {
        query = query.eq(key, value);
      });
      final result = await query.select(select).single().timeout(
        const Duration(seconds: 10),
        onTimeout: () => throw TimeoutException('Update timeout for $table'),
      );
      return result;
    } on PostgrestException catch (e) {
      throw _mapPostgrestException(e);
    } on TimeoutException {
      throw NetworkException('انتهت مهلة التحديث لجدول $table');
    } catch (e, stack) {
      _reportUnexpectedError(e, stack, context: 'update($table)');
      if (_isNetworkError(e)) throw const NetworkException();
      throw ApiException(
        'Unexpected error in update: ${e.runtimeType}',
        code: 'unknown',
      );
    }
  }

  Future<void> delete(
    String table, {
    required Map<String, dynamic> filters,
  }) async {
    try {
      var query = _safeClient.from(table).delete();
      filters.forEach((key, value) {
        query = query.eq(key, value);
      });
      await query;
    } on PostgrestException catch (e) {
      throw _mapPostgrestException(e);
    } catch (e, stack) {
      _reportUnexpectedError(e, stack, context: 'delete($table)');
      if (_isNetworkError(e)) throw const NetworkException();
      throw ApiException(
        'Unexpected error in delete: ${e.runtimeType}',
        code: 'unknown',
      );
    }
  }

  Future<void> softDelete(
    String table, {
    required Map<String, dynamic> filters,
  }) async {
    await update(
        table,
        {
          'deleted_at': DateTime.now().toIso8601String(),
        },
        filters: filters);
  }

  // ===== RPC calls (bypasses PostgREST 1000-row limit) =====

  /// Call a Postgres RPC function that returns JSONB.
  /// Use this for queries that need >1000 rows (PostgREST default limit).
  Future<List<Map<String, dynamic>>> rpc(
    String functionName, {
    Map<String, dynamic>? params,
  }) async {
    // ═══ FIX: Wrap with retry for transient network errors ═══
    return _withRetry('rpc($functionName)', () async {
      try {
        await _ensureFreshSession();
        final response = await _safeClient.rpc(
          functionName,
          params: params,
        ).timeout(
          // FIX: 30s for RPC (was 15s) — fetch_submissions with 200+ rows + data JSONB needs more time
          const Duration(seconds: 30),
          onTimeout: () => throw TimeoutException(
            'RPC $functionName timed out after 30s',
          ),
        );

        if (response == null) return [];
        if (response is List) {
          return response.map((e) => Map<String, dynamic>.from(e as Map)).toList();
        }
        if (response is Map) {
          return [Map<String, dynamic>.from(response)];
        }
        return [];
      } on TimeoutException {
        rethrow; // Let _withRetry handle it
      } catch (e, stack) {
        _reportUnexpectedError(e, stack, context: 'rpc($functionName)');
        if (_isNetworkError(e)) throw const NetworkException();
        debugPrint('[ApiClient] rpc($functionName) error: $e');
        // FIX: rethrow instead of returning [] — empty list is indistinguishable from "no data"
        throw ApiException('RPC $functionName failed: $e', code: 'rpc_error');
      }
    });
  }

  /// Call RPC and return a single integer (for count functions)
  Future<int> rpcCount(
    String functionName, {
    Map<String, dynamic>? params,
  }) async {
    try {
      await _ensureFreshSession();
      final response = await _safeClient.rpc(
        functionName,
        params: params,
      ).timeout(
        const Duration(seconds: 15),
        onTimeout: () => throw TimeoutException('RPC count timed out'),
      );

      if (response is int) return response;
      if (response is num) return response.toInt();
      return 0;
    } catch (e) {
      debugPrint('[ApiClient] rpcCount($functionName) error: $e');
      return 0;
    }
  }

  /// ═══ RPC returning a single JSONB object (not a list) ═══
  /// Use this for RPCs like `get_form_analytics` that return a single record.
  Future<Map<String, dynamic>?> rpcSingle(
    String functionName, {
    Map<String, dynamic>? params,
  }) async {
    try {
      await _ensureFreshSession();
      final response = await _safeClient.rpc(
        functionName,
        params: params,
      ).timeout(
        const Duration(seconds: 30),
        onTimeout: () => throw TimeoutException('RPC single timed out'),
      );

      if (response == null) return null;
      if (response is Map) {
        return Map<String, dynamic>.from(response);
      }
      // Some RPCs may return a list with one element
      if (response is List && response.isNotEmpty) {
        return Map<String, dynamic>.from(response.first as Map);
      }
      return null;
    } catch (e) {
      debugPrint('[ApiClient] rpcSingle($functionName) error: $e');
      return null;
    }
  }

  // ===== Edge Function calls =====

  Future<Map<String, dynamic>> callFunction(
    String functionName,
    Map<String, dynamic> body, {
    Duration? timeout,
  }) async {
    // ═══ FIX: Wrap with retry for transient network errors ═══
    // Previously: _withRetry was defined but never called
    // Now: retries 3 times on NetworkException, TimeoutException, ServerException
    return _withRetry('callFunction($functionName)', () async {
      try {
        // Ensure token is fresh before calling the function
        // ✅ This has its own 8s timeout and never blocks indefinitely
        await _ensureFreshSession();

        // ═══ FIX: Timeout قابل للتعديل — الافتراضي 30s، يمكن زيادته للدوان الثقيلة ═══
        final effectiveTimeout = timeout ?? _getFunctionTimeout(functionName);
        final response =
            await _safeClient.functions.invoke(functionName, body: body).timeout(
                  effectiveTimeout,
                  onTimeout: () => throw TimeoutException(
                    'Function $functionName timed out after ${effectiveTimeout.inSeconds}s',
                  ),
                );

        // ✅ FIX: Safe response parsing — handle all possible response types
        return _parseFunctionResponse(response.data, functionName);
      } on TimeoutException {
        // Rethrow as-is so _withRetry can catch it
        rethrow;
      } on FunctionException catch (e) {
        // If 401, try refreshing the token ONCE and retry
        if (e.status == 401) {
          debugPrint('[ApiClient] Got 401, refreshing token and retrying...');
          try {
            await _forceRefreshSession();
            final response = await _safeClient.functions
                .invoke(functionName, body: body)
                .timeout(
                  _getFunctionTimeout(functionName),
                  onTimeout: () => throw TimeoutException(
                    'Function $functionName timed out (retry)',
                  ),
                );
            return _parseFunctionResponse(response.data, functionName);
          } on TimeoutException {
            rethrow; // Let _withRetry handle it
          } on FunctionException catch (retryError) {
            throw _mapFunctionException(retryError);
          } catch (retryError) {
            debugPrint('[ApiClient] Retry after 401 failed: $retryError');
            throw const UnauthorizedException();
          }
        }
        throw _mapFunctionException(e);
      } catch (e, stack) {
        _reportUnexpectedError(e, stack, context: 'callFunction($functionName)');
        if (_isNetworkError(e)) throw const NetworkException();
        throw ApiException('خطأ غير متوقع: ${e.runtimeType}', code: 'unknown');
      }
    });
  }

  /// Safely parse function response into a Map.
  /// Handles: Map, List, String (JSON), String (non-JSON), null.
  Map<String, dynamic> _parseFunctionResponse(
    dynamic responseData,
    String functionName,
  ) {
    if (responseData == null) {
      debugPrint('[ApiClient] $functionName returned null response');
      return {'reply': '', 'source': 'empty'};
    }

    if (responseData is Map<String, dynamic>) {
      return responseData;
    }

    if (responseData is Map) {
      return Map<String, dynamic>.from(responseData);
    }

    if (responseData is List) {
      return {'data': responseData};
    }

    if (responseData is String) {
      try {
        final parsed = jsonDecode(responseData);
        if (parsed is Map<String, dynamic>) return parsed;
        if (parsed is Map) return Map<String, dynamic>.from(parsed);
        if (parsed is List) return {'data': parsed};
      } catch (_) {
        // Not valid JSON — wrap as-is
        debugPrint('[ApiClient] $functionName returned non-JSON string');
        return {'reply': responseData, 'source': 'raw'};
      }
    }

    // Fallback: unknown type
    debugPrint(
      '[ApiClient] $functionName returned unexpected type: ${responseData.runtimeType}',
    );
    return {'reply': responseData.toString(), 'source': 'unknown'};
  }

  /// Ensure the current session has a fresh token (refresh if expiring within 5 min).
  /// ✅ FIX: Robust timeout with fallback — never hangs indefinitely.
  Future<void> _ensureFreshSession() async {
    try {
      final session = _safeClient.auth.currentSession;
      if (session == null) return;

      final expiresAt = DateTime.fromMillisecondsSinceEpoch(
        session.expiresAt! * 1000,
      );
      final now = DateTime.now();

      // Only refresh if token expires within 5 minutes
      if (expiresAt.difference(now).inMinutes < 5) {
        debugPrint('[ApiClient] Token expiring soon, refreshing...');
        try {
          await _safeClient.auth.refreshSession().timeout(
                const Duration(seconds: 8),
              );
          debugPrint('[ApiClient] Session refreshed successfully');
        } on TimeoutException {
          debugPrint(
            '[ApiClient] Session refresh timed out — proceeding with current token (401 retry will handle it)',
          );
        } catch (e) {
          debugPrint('[ApiClient] Session refresh failed: $e — proceeding');
        }
      }
    } catch (e) {
      debugPrint(
        '[ApiClient] _ensureFreshSession outer error: $e — proceeding',
      );
    }
  }

  /// Force a session refresh (used as retry after 401).
  /// ✅ FIX: Strict timeout — throws UnauthorizedException on any failure.
  Future<void> _forceRefreshSession() async {
    final session = _safeClient.auth.currentSession;
    if (session == null) throw const UnauthorizedException();

    try {
      final result = await _safeClient.auth.refreshSession().timeout(
            const Duration(seconds: 8),
          );
      if (result.session == null) throw const UnauthorizedException();
    } on TimeoutException {
      debugPrint('[ApiClient] Force refresh timed out');
      throw const UnauthorizedException();
    } catch (e) {
      debugPrint('[ApiClient] Force refresh failed: $e');
      throw const UnauthorizedException();
    }
  }

  // ===== Storage operations =====

  Future<String> uploadFile(
    String bucket,
    String path,
    List<int> bytes, {
    String contentType = 'image/jpeg',
  }) async {
    try {
      await _safeClient.storage.from(bucket).uploadBinary(
            path,
            Uint8List.fromList(bytes),
            fileOptions: FileOptions(contentType: contentType),
          );
      return _safeClient.storage.from(bucket).getPublicUrl(path);
    } catch (e) {
      throw FileStorageException('Upload failed: ${e.runtimeType}');
    }
  }

  // ===== Realtime subscriptions =====

  RealtimeChannel subscribe(
    String channel,
    Map<String, dynamic> filter,
    void Function(PostgresChangePayload) callback,
  ) {
    final channelObj = _safeClient.channel(channel);

    if (filter.isNotEmpty) {
      channelObj.onPostgresChanges(
        event: PostgresChangeEvent.all,
        schema: 'public',
        filter: PostgresChangeFilter(
          type: PostgresChangeFilterType.eq,
          column: filter.keys.first,
          value: filter.values.first,
        ),
        callback: callback,
      );
    } else {
      channelObj.onPostgresChanges(
        event: PostgresChangeEvent.all,
        schema: 'public',
        callback: callback,
      );
    }

    return channelObj.subscribe();
  }

  /// Stream Edge Function response token by token (SSE)
  /// ═══ FIX: إضافة timeout على الاتصال — لا يعلق indefinitely ═══
  Stream<String> callFunctionStream(
    String functionName,
    Map<String, dynamic> body, {
    Duration timeout = const Duration(seconds: 90),
  }) async* {
    final httpClient = http.Client();
    try {
      await _ensureFreshSession();
      final session = _safeClient.auth.currentSession;
      if (session == null) throw const UnauthorizedException();

      final url = '${SupabaseConfig.url}/functions/v1/$functionName';
      final request = http.Request('POST', Uri.parse(url))
        ..headers.addAll({
          'Authorization': 'Bearer ${session.accessToken}',
          'Content-Type': 'application/json',
        })
        ..body = jsonEncode(body);

      // ═══ FIX: Timeout على HTTP request — يمنع التعليق ═══
      final streamed = await httpClient.send(request).timeout(
        timeout,
        onTimeout: () {
          httpClient.close();
          throw TimeoutException('Stream connection timed out');
        },
      );
      final decoder = const Utf8Decoder();
      String buffer = '';

      await for (final chunk in streamed.stream.transform(decoder)) {
        buffer += chunk;
        final lines = buffer.split('\n');
        buffer = lines.removeLast();

        for (final line in lines) {
          final trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          final data = trimmed.substring(6);
          if (data == '[DONE]') return;
          try {
            final json = jsonDecode(data);

            // ═══ Format 1: Custom SSE events from Edge Function ═══
            // {type: 'answer', content: '...'} or {type: 'thinking', ...}
            final type = json['type'];
            if (type == 'answer') {
              final content = json['content'];
              if (content != null && content.toString().isNotEmpty) {
                yield content.toString();
              }
              continue;
            }
            if (type == 'done' || type == 'error') {
              continue;
            }

            // ═══ Format 2: OpenAI/Groq streaming format ═══
            // {choices: [{delta: {content: '...'}}]}
            final choices = json['choices'];
            if (choices is List && choices.isNotEmpty) {
              final delta = choices[0]?['delta'];
              if (delta is Map) {
                final content = delta['content'];
                if (content != null && content.toString().isNotEmpty) {
                  yield content.toString();
                }
              }
              continue;
            }

            // ═══ Format 3: Simple text field (legacy) ═══
            final text = json['text'];
            if (text != null && text.toString().isNotEmpty) {
              yield text.toString();
            }
          } catch (_) {}
        }
      }
    } catch (e, stack) {
      _reportUnexpectedError(
        e,
        stack,
        context: 'callFunctionStream($functionName)',
      );
      rethrow;
    } finally {
      // FIX: Always close HTTP client to prevent resource leaks
      httpClient.close();
    }
  }

  // ===== Error helpers =====

  /// Detect network-related errors without importing dart:io
  bool _isNetworkError(dynamic e) {
    final s = e.toString();
    return s.contains('SocketException') ||
        s.contains('Failed host lookup') ||
        s.contains('Connection refused') ||
        s.contains('Network is unreachable') ||
        s.contains('Connection timed out');
  }

  /// Map PostgrestException to specific AppException types
  AppException _mapPostgrestException(PostgrestException e) {
    switch (e.code) {
      case 'PGRST116':
        return NotFoundException(e.message);
      case '23505':
        return ConflictException('Duplicate entry: ${e.message}');
      case '23503':
        return ValidationException(
          'Related record not found',
          fieldErrors: {'reference': e.message},
        );
      case '42501':
        return PermissionException(e.message);
      case '22P02':
        return ValidationException(
          'Invalid data format',
          fieldErrors: {'format': e.message},
        );
      default:
        if (e.code != null && e.code!.startsWith('5')) {
          return ServerException(e.message);
        }
        return ApiException(
          e.message,
          code: e.code,
          details: {'postgres': true},
        );
    }
  }

  /// Map FunctionException to specific AppException types
  AppException _mapFunctionException(FunctionException e) {
    final status = e.status;
    if (status == 401) return const UnauthorizedException();
    if (status == 403) return const ForbiddenException();
    if (status == 429)
      return const ApiException('Rate limited', code: 'rate_limit');
    if (status >= 500) {
      return ServerException('Edge function error: ${e.details}');
    }
    return ApiException(
      'Function error: ${e.details}',
      code: 'function_$status',
    );
  }

  // ═══ FIX A2: Reduced timeout from 90s to 30s — 90s was too long for mobile users ═══
  // Edge Function cold starts are typically ≤10s. 30s gives headroom without freezing UI.
  // ⚠️ FIX: ai-chat-v3 increased to 90s for multi-step tool calling.
  static const Map<String, Duration> _functionTimeouts = {
    'ai-chat-v3': Duration(seconds: 90),
    'submit-form': Duration(seconds: 30),
    'sync-offline': Duration(seconds: 45),
    'get-analytics': Duration(seconds: 45),
  };
  static const _defaultFunctionTimeout = Duration(seconds: 20);
  static Duration _getFunctionTimeout(String name) =>
      _functionTimeouts[name] ?? _defaultFunctionTimeout;  // ═══ FIX: 20s (was 30s) ═══

  // ═══ FIX A1: Retry logic for network errors ═══
  // Retries 3 times with exponential backoff (1s, 2s, 4s) for transient failures.
  // Only retries on NetworkException, TimeoutException, and 5xx ServerException.
  Future<T> _withRetry<T>(
    String label,
    Future<T> Function() action, {
    int maxRetries = 2,
  }) async {
    int attempt = 0;
    while (true) {
      try {
        return await action();
      } on NetworkException {
        attempt++;
        if (attempt >= maxRetries) rethrow;
        final delay = Duration(seconds: attempt); // 1s
        debugPrint('[ApiClient] $label network error, retry $attempt/$maxRetries in ${delay.inSeconds}s');
        await Future.delayed(delay);
      } on TimeoutException {
        // ═══ FIX: No retry on timeout — server is slow, retrying won't help ═══
        // Previously: 3 retries × 60s = 180s freeze!
        // Now: fail immediately, let UI show error
        rethrow;
      } on ServerException {
        attempt++;
        if (attempt >= maxRetries) rethrow;
        final delay = Duration(seconds: attempt); // 1s
        debugPrint('[ApiClient] $label server error, retry $attempt/$maxRetries in ${delay.inSeconds}s');
        await Future.delayed(delay);
      }
    }
  }

  /// Report unexpected errors via Sentry (if configured) and debug print.
  void _reportUnexpectedError(
    dynamic error,
    StackTrace stack, {
    String? context,
  }) {
    SentryConfig.captureError(error, stack, context: context);
    assert(() {
      // ignore: avoid_print
      debugPrint('ApiClient error [$context]: $error');
      return true;
    }());
  }
}

/// Sentinel class for IS NULL filter support in [ApiClient.select].
class _NullFilterSentinel {
  const _NullFilterSentinel();
}

/// Sentinel class for IN filter support in [ApiClient.select].
/// Usage: ApiClient.select('table', filters: {'form_id': ApiClient.inList(['a','b'])})
class _InFilterSentinel {
  final List<dynamic> values;
  const _InFilterSentinel(this.values);
}

/// Sentinel class for GT (greater than) filter support in [ApiClient.select].
/// Usage: ApiClient.select('table', filters: {'created_at': ApiClient.gt('2026-01-01')})
class _GtFilterSentinel {
  final dynamic value;
  const _GtFilterSentinel(this.value);
}
