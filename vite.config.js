import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',        // 빌드 결과물 폴더
    rollupOptions: {
      input: 'src/main.js' // entry 파일 지정 (HTML 대신 JS 단일 진입점)
    }
  }
});
//개발 서버를 실행하지 않고 번들만 생성하는 용도로 vite 사용 -> 현재까지는 마크다운 에디터 npm을 이용하려고 함