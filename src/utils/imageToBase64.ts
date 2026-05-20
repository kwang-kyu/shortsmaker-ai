/** 업로드 이미지를 압축/리사이즈한 뒤 OpenAI Vision용 data URL(base64)로 변환 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("이미지 파일만 업로드할 수 있습니다."));
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;

      if (typeof result !== "string") {
        reject(new Error("이미지 데이터를 읽지 못했습니다."));
        return;
      }

      const img = new Image();

      img.onload = () => {
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        const JPEG_QUALITY = 0.8;

        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("이미지 압축을 처리하지 못했습니다."));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);

        resolve(compressedDataUrl);
      };

      img.onerror = () => {
        reject(new Error("이미지를 불러오지 못했습니다."));
      };

      img.src = result;
    };

    reader.onerror = () => {
      reject(new Error("이미지 파일을 읽는 중 오류가 발생했습니다."));
    };

    reader.readAsDataURL(file);
  });
}
