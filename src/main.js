// import Editor from '@toast-ui/editor';
// import Tagify from '@yaireo/tagify';
// import '@toast-ui/editor/dist/toastui-editor-only.css';
// import '@toast-ui/editor/dist/toastui-editor-viewer.css';
// import '@toast-ui/editor/dist/toastui-editor.css';
// import '@yaireo/tagify/dist/tagify.css';

// // Editor 초기화
// const editor = new Editor({
//   el: document.querySelector('#editor'),
//   initialEditType: 'markdown',
//   previewStyle: 'vertical',
//   height: '300px',
//   usageStatistics: false,
//   initialValue: document.querySelector('#editor').innerText || '',
// });

// // 폼 제출 시 hidden input에 마크다운 값 저장
// const form = document.getElementById('studyForm');
// form.addEventListener('submit', () => {
//   document.getElementById('description').value = editor.getMarkdown();
// });

// // Tagify 초기화
// const input = document.querySelector('input[name=techstack]');
// const tagify = new Tagify(input);

// // 카카오 지도 초기화
// var mapContainer = document.getElementById('map'),
//   mapOption = {
//     center: new kakao.maps.LatLng(37.5665, 126.9780),
//     level: 5,
//   };
// var map = new kakao.maps.Map(mapContainer, mapOption);

// var marker = new kakao.maps.Marker({
//   position: map.getCenter(),
// });
// marker.setMap(map);

// kakao.maps.event.addListener(map, 'click', function (mouseEvent) {
//   var latlng = mouseEvent.latLng;

//   marker.setPosition(latlng);

//   document.getElementById('location_lat').value = latlng.getLat();
//   document.getElementById('location_lng').value = latlng.getLng();
// });

// // 만약 초기 위치값이 있으면 마커 위치 설정
// const initLat = document.getElementById('location_lat').value;
// const initLng = document.getElementById('location_lng').value;
// if (initLat && initLng) {
//   const initPos = new kakao.maps.LatLng(initLat, initLng);
//   marker.setPosition(initPos);
//   map.setCenter(initPos);
// }

// //css , 초기화 js 코드 작성한다고 만들어 둔 임시 파일 .. 
// vite로 빌드했으면 삭제해도 무방할듯듯