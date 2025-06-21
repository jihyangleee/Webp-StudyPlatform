import Editor from '@toast-ui/editor';
import Tagify from '@yaireo/tagify';
import '@toast-ui/editor/dist/toastui-editor.css';
import '@yaireo/tagify/dist/tagify.css';

document.addEventListener('DOMContentLoaded', () => {
  //  Toast UI Editor
  const editorEl = document.querySelector('#editor');
  const initialValue = document.getElementById('initial-description')?.textContent || '';

  if (editorEl && !document.querySelector('.toastui-editor-defaultUI')) {
    window.editorInstance = new Editor({
      el: editorEl,
      height: '300px',
      initialEditType: 'markdown',
      previewStyle: 'vertical',
      usageStatistics: false,
      initialValue: initialValue,
      placeholder: '내용을 입력하세요'
    });
  }

  //  Tagify 기술스택 입력
  const input = document.querySelector('input[name=techstack]');
  if (input) {
    new Tagify(input);
  }

  //  Kakao 지도 초기화
  const mapContainer = document.getElementById('map');
  if (mapContainer && window.kakao?.maps) {
    const map = new kakao.maps.Map(mapContainer, {
      center: new kakao.maps.LatLng(37.5665, 126.9780),
      level: 5
    });

    let marker = new kakao.maps.Marker({
      position: map.getCenter()
    });
    marker.setMap(map);

    kakao.maps.event.addListener(map, 'click', function (mouseEvent) {
      const latlng = mouseEvent.latLng;
      marker.setPosition(latlng);

      document.getElementById('location_lat').value = latlng.getLat();
      document.getElementById('location_lng').value = latlng.getLng();
    });

    const initLat = document.getElementById('location_lat')?.value;
    const initLng = document.getElementById('location_lng')?.value;
    if (initLat && initLng) {
      const initPos = new kakao.maps.LatLng(initLat, initLng);
      marker.setPosition(initPos);
      map.setCenter(initPos);
    }
  }
});


