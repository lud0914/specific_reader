
(function(window, document) {
    'use strict';

    var defaults = {
        thresholdDepth: 0.8,     
        speedStandard: 300,      
        eventName: 'specific_reader', 
        timeoutMinutes: 5,       
        debug: false            
    };

    // 2. 사용자 설정 병합 (HTML에서 window.ReaderTrackerConfig로 덮어쓸 수 있습니다.)
    var userConfig = window.ReaderTrackerConfig || {};
    var cfg = {};
    for (var key in defaults) {
        cfg[key] = (userConfig.hasOwnProperty(key)) ? userConfig[key] : defaults[key];
    }

    var log = function(msg) {
        if (cfg.debug) console.log('[ReaderTracker]', msg);
    };

    try {
        var accumScrollMove = 0;
        var accumScrollTime = 1;
        var latestScrollTop = 0;
        var latestScrollAt = new Date();
        var maxScrollRatio = 0;
        
        var isDataSent = false;
        var isPaused = false;

        window.dataLayer = window.dataLayer || [];

        document.addEventListener('visibilitychange', function() {
            if (document.visibilityState === 'hidden') {
                isPaused = true;
                log('Tracking Paused (Tab Hidden)');
            } else {
                isPaused = false;
                latestScrollAt = new Date(); // 돌아오면 시간 기준점 리셋 (중요)
                log('Tracking Resumed');
            }
        });

        function checkScroll() {
            if (isPaused) {
                setTimeout(checkScroll, 500);
                return;
            }

            var scrollTop = window.scrollY || document.documentElement.scrollTop;
            var docHeight = document.body.scrollHeight;
            var winHeight = window.innerHeight;
            var scrollAt = new Date();

            var currentRatio = (scrollTop + winHeight) / docHeight;
            if (currentRatio > maxScrollRatio) maxScrollRatio = currentRatio;

            var scrollTopDelta = Math.abs(latestScrollTop - scrollTop);
            var scrollTimeDelta = Math.min(scrollAt - latestScrollAt, cfg.timeoutMinutes * 60 * 1000);

            if (scrollTopDelta !== 0 || scrollTimeDelta > 0) {
                latestScrollTop = scrollTop;
                latestScrollAt = scrollAt;
                
                accumScrollMove += scrollTopDelta;
                accumScrollTime += scrollTimeDelta;
            }

            if (!isDataSent && currentRatio > cfg.thresholdDepth) {
                sendEvent('reach_threshold');
            }

            setTimeout(checkScroll, 500);
        }

        function sendEvent(triggerType) {
            var pixelPerSec = Math.floor(accumScrollMove / accumScrollTime * 1000);
            var label = '';

            if (triggerType === 'reach_threshold') {
                // 설정된 속도(예: 300)보다 빠르면 Skimmer로 분류합니다.
                label = pixelPerSec > cfg.speedStandard ? 'skimmer' : 'reader';
            } else if (triggerType === 'exit') {
                // 80% 못 보고 나가면 Bouncer로 분류합니다.
                label = 'bouncer';
            }

            var payload = {
                'event': cfg.eventName,
                'reader_type': label,
                'reader_value': pixelPerSec,
                'max_scroll_depth': (maxScrollRatio * 100).toFixed(0)
            };

            window.dataLayer.push(payload);
            isDataSent = true;
            log('Sent: ' + JSON.stringify(payload));
        }

        // 실행 시작
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', checkScroll);
        } else {
            checkScroll();
        }

        window.addEventListener('pagehide', function() {
            if (!isDataSent) sendEvent('exit');
        });

        log('Tracker Initialized');

    } catch (e) {
        console.error("ReaderTracker Error:", e);
    }

})(window, document);
