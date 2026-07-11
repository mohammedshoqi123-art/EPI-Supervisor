import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:epi_shared/epi_shared.dart';

/// ═══════════════════════════════════════════════════════════
/// SupervisorCardSheet — بطاقة المشرف الذكية المنبثقة
///
///  تُعرض عند الضغط على اسم أي مشرف في الشات:
///   - اسم المشرف + الدور + المحافظة + المديرية
///   - إحصائيات الأداء هذا الشهر
///   - زر "رسالة في قناة" + زر "سجل العمل"
/// ═══════════════════════════════════════════════════════════

class SupervisorCardSheet extends StatefulWidget {
  final String userId;
  final String userName;
  final String role;
  final String? governorateId;
  final String? districtId;

  const SupervisorCardSheet({
    super.key,
    required this.userId,
    required this.userName,
    required this.role,
    this.governorateId,
    this.districtId,
  });

  /// Show as bottom sheet
  static Future<void> show(
    BuildContext context, {
    required String userId,
    required String userName,
    required String role,
    String? governorateId,
    String? districtId,
  }) {
    HapticFeedback.lightImpact();
    return showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => SupervisorCardSheet(
        userId: userId,
        userName: userName,
        role: role,
        governorateId: governorateId,
        districtId: districtId,
      ),
    );
  }

  @override
  State<SupervisorCardSheet> createState() => _SupervisorCardSheetState();
}

class _SupervisorCardSheetState extends State<SupervisorCardSheet> {
  Map<String, dynamic>? _stats;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    try {
      final client = Supabase.instance.client;
      final now = DateTime.now();
      final monthStart = DateTime(now.year, now.month, 1).toUtc().toIso8601String();

      // Fetch submissions count for this user this month
      final response = await client
          .from('form_submissions')
          .select('status, data')
          .eq('submitted_by', widget.userId)
          .gte('created_at', monthStart)
          .limit(1000);

      int total = 0;
      int submitted = 0;
      int drafts = 0;
      double complianceRate = 0;
      int complianceYes = 0;
      int complianceTotal = 0;

      for (final s in response as List) {
        total++;
        if (s['status'] == 'submitted') submitted++;
        if (s['status'] == 'draft') drafts++;

        // Calculate compliance from yes/no fields
        final data = s['data'] as Map<String, dynamic>?;
        if (data != null) {
          for (final v in data.values) {
            if (v == true) {
              complianceYes++;
              complianceTotal++;
            } else if (v == false) {
              complianceTotal++;
            }
          }
        }
      }

      if (complianceTotal > 0) {
        complianceRate = (complianceYes / complianceTotal) * 100;
      }

      if (mounted) {
        setState(() {
          _stats = {
            'total': total,
            'submitted': submitted,
            'drafts': drafts,
            'compliance_rate': complianceRate,
          };
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // ═══ Handle ═══
          Container(
            width: 40,
            height: 4,
            margin: const EdgeInsets.only(top: 12, bottom: 16),
            decoration: BoxDecoration(
              color: Colors.grey.shade300,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          // ═══ Header with avatar ═══
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        _roleColor(widget.role),
                        _roleColor(widget.role).withValues(alpha: 0.7),
                      ],
                    ),
                    borderRadius: BorderRadius.circular(18),
                    boxShadow: [
                      BoxShadow(
                        color: _roleColor(widget.role).withValues(alpha: 0.3),
                        blurRadius: 8,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                  child: Center(
                    child: Text(
                      widget.userName.isNotEmpty
                          ? widget.userName.substring(
                              0,
                              widget.userName.length > 2
                                  ? 2
                                  : widget.userName.length)
                          : '؟',
                      style: const TextStyle(
                        fontFamily: 'Cairo',
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.userName,
                        style: const TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 17,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF1A2332),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: _roleColor(widget.role)
                                  .withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              _roleLabelAr(widget.role),
                              style: TextStyle(
                                fontFamily: 'Cairo',
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                color: _roleColor(widget.role),
                              ),
                            ),
                          ),
                          const SizedBox(width: 6),
                          Icon(Icons.verified_rounded,
                              size: 14, color: Colors.grey.shade400),
                          const SizedBox(width: 3),
                          Text(
                            'مشرف نشط',
                            style: TextStyle(
                              fontFamily: 'Tajawal',
                              fontSize: 10,
                              color: Colors.grey.shade500,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          // ═══ Stats ═══
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: _loading
                ? const Center(
                    child: Padding(
                      padding: EdgeInsets.all(20),
                      child: CircularProgressIndicator(),
                    ),
                  )
                : Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'أداء هذا الشهر',
                        style: TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF6B7280),
                        ),
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          _statCard(
                            'الإرساليات',
                            '${_stats?['submitted'] ?? 0}',
                            Icons.send_rounded,
                            const Color(0xFF1976D2),
                          ),
                          const SizedBox(width: 8),
                          _statCard(
                            'المسودات',
                            '${_stats?['drafts'] ?? 0}',
                            Icons.edit_note_rounded,
                            const Color(0xFFF57C00),
                          ),
                          const SizedBox(width: 8),
                          _statCard(
                            'الإجمالي',
                            '${_stats?['total'] ?? 0}',
                            Icons.assessment_rounded,
                            const Color(0xFF00897B),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      // Compliance progress
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF9FAFB),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment:
                                  MainAxisAlignment.spaceBetween,
                              children: [
                                const Text(
                                  'نسبة الالتزام',
                                  style: TextStyle(
                                    fontFamily: 'Tajawal',
                                    fontSize: 11,
                                    color: Color(0xFF6B7280),
                                  ),
                                ),
                                Text(
                                  '${(_stats?['compliance_rate'] ?? 0).toStringAsFixed(1)}%',
                                  style: TextStyle(
                                    fontFamily: 'Cairo',
                                    fontSize: 13,
                                    fontWeight: FontWeight.w800,
                                    color: _complianceColor(
                                        _stats?['compliance_rate'] ?? 0),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            ClipRRect(
                              borderRadius: BorderRadius.circular(6),
                              child:
                                  LinearProgressIndicator(
                                value:
                                    ((_stats?['compliance_rate'] ?? 0) /
                                        100),
                                backgroundColor: Colors.grey.shade300,
                                valueColor: AlwaysStoppedAnimation(
                                    _complianceColor(
                                        _stats?['compliance_rate'] ?? 0)),
                                minHeight: 6,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
          ),
          const SizedBox(height: 16),
          // ═══ Action buttons ═══
          Padding(
            padding: EdgeInsets.only(
              left: 20,
              right: 20,
              bottom: MediaQuery.of(context).padding.bottom + 20,
            ),
            child: Row(
              children: [
                Expanded(
                  child: FilledButton.icon(
                    onPressed: () {
                      Navigator.pop(context);
                      // Navigate to chat with this user's filter
                      // (or open feedback composer with prefilled recipient)
                    },
                    style: FilledButton.styleFrom(
                      backgroundColor: AppTheme.primaryColor,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                    icon: const Icon(Icons.feedback_outlined, size: 18),
                    label: const Text('تغذية راجعة',
                        style: TextStyle(
                            fontFamily: 'Cairo',
                            fontSize: 12,
                            fontWeight: FontWeight.w700)),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      Navigator.pop(context);
                      // Navigate to user's submissions
                    },
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                      side: BorderSide(color: Colors.grey.shade300),
                    ),
                    icon: const Icon(Icons.history_rounded, size: 18),
                    label: const Text('سجل العمل',
                        style: TextStyle(
                            fontFamily: 'Cairo',
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF6B7280))),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _statCard(
      String label, String value, IconData icon, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color.withValues(alpha: 0.15)),
        ),
        child: Column(
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(height: 4),
            Text(
              value,
              style: TextStyle(
                fontFamily: 'Cairo',
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: color,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: const TextStyle(
                fontFamily: 'Tajawal',
                fontSize: 9,
                color: Color(0xFF9CA3AF),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _roleColor(String role) {
    switch (role) {
      case 'admin':
      case 'central':
        return const Color(0xFFEF4444);
      case 'governorate':
        return const Color(0xFF1976D2);
      case 'district':
        return const Color(0xFF388E3C);
      case 'data_entry':
        return const Color(0xFFF57C00);
      default:
        return const Color(0xFF607D8B);
    }
  }

  String _roleLabelAr(String role) {
    switch (role) {
      case 'admin':
        return 'مدير النظام';
      case 'central':
        return 'مركزي';
      case 'governorate':
        return 'محافظة';
      case 'district':
        return 'مديرية';
      case 'data_entry':
        return 'ميداني';
      default:
        return role;
    }
  }

  Color _complianceColor(double rate) {
    if (rate >= 80) return const Color(0xFF388E3C);
    if (rate >= 60) return const Color(0xFFF57C00);
    return const Color(0xFFD32F2F);
  }
}
