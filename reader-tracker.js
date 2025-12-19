/**
 * Reader Tracker JS
 * - 스크롤 깊이와 속도를 기반으로 Reader/Skimmer/Bouncer 분류
 * - GitHub + jsDelivr 배포용
 */
(function(window, document) {
    'use strict';

    var defaults = {
        thresholdDepth: 0.8,     
        speedStandard: 300,      
        eventName: 'content_consumption', 
        timeoutMinutes: 5,      
        debug: false            
    };

    // 외부에서 원하는 경우 설정 변경 가능 (window.ReaderTrackerConfig로 덮어쓰기 가능)
    var userConfig = window.ReaderTrackerConfig || {};
    var cfg = {};
    for (var key in defaults) {
        cfg[key] = (userConfig.hasOwnProperty(key)) ? userConfig[key] : defaults[key];
    }

    // 디버그용 로거
    var log = function(msg) {
        if (cfg.debug) console.log('[ReaderTracker]', msg);
    };

    try {
        var accumScrollMove = 0;
        var accumScrollTime = 1; // 0 나누는 것을 방지하기 위한 초기값입니다.
        var latestScrollTop = 0;
        var latestScrollAt = new Date();
        var maxScrollRatio = 0;
        var isDataSent = false;
        var isPaused = false;

        window.dataLayer = window.dataLayer || [];

        // 탭 비활성화 시 측정 미진행
        document.addEventListener('visibilitychange', function() {
            if (document.visibilityState === 'hidden') {
                isPaused = true;
            } else {
                isPaused = false;
                latestScrollAt = new Date();
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

            // 현재 깊이 갱신
            var currentRatio = (scrollTop + winHeight) / docHeight;
            if (currentRatio > maxScrollRatio) maxScrollRatio = currentRatio;

            // 이동 거리 및 시간 계산
            var scrollTopDelta = Math.abs(latestScrollTop - scrollTop);
            var scrollTimeDelta = Math.min(new Date() - latestScrollAt, cfg.timeoutMinutes * 60 * 1000);

            if (scrollTopDelta !== 0 || scrollTimeDelta > 0) {
                latestScrollTop = scrollTop;
                latestScrollAt = new Date();
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
                // 설정된 속도(300)보다 빠르면 Skimmer 분류
                label = pixelPerSec > cfg.speedStandard ? 'skimmer' : 'reader';
            } else if (triggerType === 'exit') {
                // 80% 까지 도달하지 못하고 나가면 Bouncer 분류
                label = 'bouncer';
            }

            window.dataLayer.push({
                'event': cfg.eventName,
                'reader_type': label,
                'reader_value': pixelPerSec,
                'max_scroll_depth': (maxScrollRatio * 100).toFixed(0)
            });

            isDataSent = true;
            log('Sent Event: ' + label + ' (' + pixelPerSec + 'px/s)');
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', checkScroll);
        } else {
            checkScroll();
        }

        // [조건 2] 이탈 시 전송 (Bouncer 처리)
        window.addEventListener('pagehide', function() {
            if (!isDataSent) sendEvent('exit');
        });

        log('Tracker Initialized');

    } catch (e) {
        console.error("ReaderTracker Error:", e);
    }

})(window, document);
