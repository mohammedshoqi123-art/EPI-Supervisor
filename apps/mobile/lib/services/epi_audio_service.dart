import 'package:flutter/foundation.dart';
import 'package:flutter_tts/flutter_tts.dart';

/// ═══════════════════════════════════════════════════════════
///  EPI Audio TTS Service — NotebookLM-style Podcast Player
///
///  Converts Audio Overview script segments to actual speech using
///  device-native TTS. Two distinct voices for the two hosts:
///  - Host1 (أحمد): male voice, slower pace, expert tone
///  - Host2 (فاطمة): female voice, normal pace, curious tone
/// ═══════════════════════════════════════════════════════════

class AudioSegment {
  final String speaker; // 'host1' or 'host2'
  final String text;
  final String? emotion;
  final List<int> citations;

  AudioSegment({
    required this.speaker,
    required this.text,
    this.emotion,
    this.citations = const [],
  });

  factory AudioSegment.fromJson(Map<String, dynamic> j) => AudioSegment(
    speaker: j['speaker'] as String? ?? 'host2',
    text: j['text'] as String? ?? '',
    emotion: j['emotion'] as String?,
    citations: (j['citations'] as List?)?.map((e) => e as int).toList() ?? [],
  );

  bool get isHost1 => speaker == 'host1';
  String get speakerName => isHost1 ? 'أحمد' : 'فاطمة';
  String get emotionEmoji => switch (emotion) {
    'enthusiastic' => '😊',
    'serious' => '😌',
    'curious' => '🤔',
    _ => '💬',
  };
}

enum PlaybackState { stopped, playing, paused }

class EpiAudioService {
  static final EpiAudioService _instance = EpiAudioService._internal();
  factory EpiAudioService() => _instance;
  EpiAudioService._internal();

  FlutterTts? _tts;
  bool _initialized = false;
  List<AudioSegment> _segments = [];
  int _currentSegment = 0;
  PlaybackState _state = PlaybackState.stopped;
  void Function(PlaybackState state)? onStateChanged;
  void Function(int segmentIndex)? onSegmentChanged;

  // ─── Available Arabic voices on device ───
  Map<String, String> _voices = {};
  String? _maleVoice;
  String? _femaleVoice;

  PlaybackState get state => _state;
  int get currentSegment => _currentSegment;
  int get totalSegments => _segments.length;
  bool get isPlaying => _state == PlaybackState.playing;

  Future<void> init() async {
    if (_initialized) return;
    _tts = FlutterTts();

    try {
      await _tts!.setLanguage('ar-SA');
      await _tts!.setSpeechRate(0.45); // Slower for clarity
      await _tts!.setVolume(1.0);
      await _tts!.setPitch(1.0);

      // Try to find male + female Arabic voices
      final voices = await _tts!.getVoices;
      if (voices != null) {
        for (final v in voices) {
          final vMap = v as Map;
          final locale = vMap['locale']?.toString() ?? '';
          final name = vMap['name']?.toString() ?? '';
          if (locale.startsWith('ar')) {
            _voices[name] = locale;
            // Heuristic: female voice often has "female" in name
            if (name.toLowerCase().contains('female') && _femaleVoice == null) {
              _femaleVoice = name;
            }
            if (name.toLowerCase().contains('male') && _maleVoice == null) {
              _maleVoice = name;
            }
          }
        }
      }
      if (kDebugMode) {
        debugPrint('[TTS] Found ${_voices.length} Arabic voices');
        debugPrint('[TTS] Male: $_maleVoice, Female: $_femaleVoice');
      }

      _tts!.setCompletionHandler(() {
        _playNextSegment();
      });

      _tts!.setErrorHandler((error) {
        debugPrint('[TTS] Error: $error');
        _setState(PlaybackState.stopped);
      });

      _initialized = true;
    } catch (e) {
      debugPrint('[TTS] Init failed: $e');
    }
  }

  void _setState(PlaybackState newState) {
    _state = newState;
    onStateChanged?.call(newState);
  }

  void _setSegment(int index) {
    _currentSegment = index;
    onSegmentChanged?.call(index);
  }

  /// Load a script and prepare for playback
  Future<void> loadScript(List<AudioSegment> segments) async {
    await init();
    _segments = segments;
    _currentSegment = 0;
    _setState(PlaybackState.stopped);
  }

  /// Start playback from current position (or from beginning)
  Future<void> play() async {
    if (_tts == null || _segments.isEmpty) return;
    await init();

    if (_currentSegment >= _segments.length) {
      _currentSegment = 0;
    }

    _setState(PlaybackState.playing);
    await _speakSegment(_segments[_currentSegment]);
  }

  Future<void> _speakSegment(AudioSegment segment) async {
    if (_tts == null) return;

    // Configure voice for this speaker
    if (segment.isHost1 && _maleVoice != null) {
      await _tts!.setVoice({'name': _maleVoice!, 'locale': 'ar-SA'});
    } else if (!segment.isHost1 && _femaleVoice != null) {
      await _tts!.setVoice({'name': _femaleVoice!, 'locale': 'ar-SA'});
    }

    // Adjust rate/pitch based on emotion
    double rate = 0.45;
    double pitch = 1.0;
    switch (segment.emotion) {
      case 'enthusiastic':
        rate = 0.5;
        pitch = 1.15;
        break;
      case 'serious':
        rate = 0.4;
        pitch = 0.95;
        break;
      case 'curious':
        rate = 0.48;
        pitch = 1.05;
        break;
      default:
        rate = 0.45;
    }

    await _tts!.setSpeechRate(rate);
    await _tts!.setPitch(pitch);

    // Strip [n] citation markers from speech
    final cleanText = segment.text.replaceAll(RegExp(r'\[\d+\]'), '').trim();
    if (cleanText.isNotEmpty) {
      await _tts!.speak(cleanText);
    } else {
      // Empty segment → skip to next
      _playNextSegment();
    }
  }

  void _playNextSegment() {
    if (_currentSegment + 1 < _segments.length) {
      _setSegment(_currentSegment + 1);
      _speakSegment(_segments[_currentSegment]);
    } else {
      // Finished
      _setState(PlaybackState.stopped);
      _setSegment(0);
    }
  }

  Future<void> pause() async {
    if (_tts == null) return;
    await _tts!.pause();
    _setState(PlaybackState.paused);
  }

  Future<void> stop() async {
    if (_tts == null) return;
    await _tts!.stop();
    _setState(PlaybackState.stopped);
    _setSegment(0);
  }

  Future<void> skipToSegment(int index) async {
    if (index < 0 || index >= _segments.length) return;
    await _tts?.stop();
    _setSegment(index);
    if (_state == PlaybackState.playing) {
      await _speakSegment(_segments[_currentSegment]);
    }
  }

  Future<void> skipNext() async {
    if (_currentSegment + 1 < _segments.length) {
      await skipToSegment(_currentSegment + 1);
    }
  }

  Future<void> skipPrevious() async {
    if (_currentSegment > 0) {
      await skipToSegment(_currentSegment - 1);
    }
  }

  void dispose() {
    _tts?.stop();
    _tts = null;
    _initialized = false;
  }
}
