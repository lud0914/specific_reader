# specific_reader
유저가 페이지를 읽는 속도와 도달 비율에 따라 유저를 3단계로 분류합니다.
1. reader - 페이지를 기준 비율_(기본 80%)_까지 300px/s로 읽은 유저
2. skimmer - 페이지를 기준 비율_(기본 80%)_까지 읽었으나, 300px/s보다 빠르게 읽은 유저
3. bouncer - 페이지를 기준 비율_(기본 80%)_에 도달하지 못하고 이탈한 유저

## 적용 방법
### dataLayer 생성
1. Google Tag Manager에서 태그를 생성합니다.
2. 맞춤 HTML 태그에 하기 코드를 추가합니다.

```JavaScript
<script>
window.ReaderTrackerConfig = {
    thresholdDepth: 0.8,  // 스크롤 깊이 (기본: 0.8)
    speedStandard: 300,   // 속도 기준 px/s (기본: 300)
    debug: false           // 디버그 모드 (기본: false)
};
</script>

<script src="https://cdn.jsdelivr.net/gh/lud0914/specific_reader_gtm/reader-tracker.js">
```

3. 트리거로 DOM 사용 가능을 활용하는 것을 추천합니다.

### 태그 구성
dataLayer 생성이 완료된 경우 실제 GA4 태그를 구성합니다.
1. Google Tag Manager 태그 생성에서 GA4 이벤트를 생성합니다.
2. G-tag 입력 후 이벤트명을 원하는 명칭으로 넣습니다.
3. 이벤트 트리거는 맞춤 이벤트로 생성하며, 이벤트명은 "specific_reader"로 진행합니다.
가급적 일부 맞춤 이벤트로 실제 블로그 콘텐츠에서만 작동하도록 구성합니다.
4. 그 후 매개변수를 구성 후 태그를 저장합니다.

#### 매개변수 구성
1. Google Tag Manager 내 변수에 접속 후 변수 생성을 진행합니다.
2. 변수를 데이터 영역 변수로 잡고 "reader_type"을 입력합니다.
3. 해당 변수를 매개변수로 구성하면 됩니다.

매개변수 구성 시, 활용에 따라 유저 속성/이벤트 속성을 나눠서 진행합니다.
- 콘텐츠별 유저의 읽기가 궁금하다면, 이벤트 속성
- 전환 등 다른 액션을 한 유저의 최근 타입이 궁금하다면 사용자 속성

