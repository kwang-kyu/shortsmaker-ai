/** 업로드 파일을 OpenAI Vision용 data URL(base64)로 변환 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("이미지 데이터를 읽지 못했습니다."));
        return;
      }
      resolve(result);
    };
    reader.onerror = () => reject(new Error("이미지 파일을 읽는 중 오류가 발생했습니다."));
    reader.readAsDataURL(file);
  });
}
