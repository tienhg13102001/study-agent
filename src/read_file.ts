import fs from "fs/promises";
import path from "path";

export type ReadFileSuccess = {
  ok: true;
  content: string;
};

export type ReadFileFailure = {
  ok: false;
  error: string;
};

export type ReadFileResult = ReadFileSuccess | ReadFileFailure;

const ALLOWED_BASE_DIR = path.resolve(process.cwd(), "src");

export async function readFile(filePath: string): Promise<ReadFileResult> {
  try {
    // 1. Chặn ngay nếu model truyền đường dẫn tuyệt đối (ví dụ: /etc/passwd hoặc C:\Windows)
    if (path.isAbsolute(filePath)) {
      return {
        ok: false,
        error: `Truy cập bị từ chối: Không chấp nhận đường dẫn tuyệt đối ('${filePath}').`,
      };
    }

    // 2. Chuẩn hóa đường dẫn tương đối dựa trên ALLOWED_BASE_DIR
    const resolvedPath = path.resolve(ALLOWED_BASE_DIR, filePath);

    // Symlink có thể trỏ ra ngoài src/, nên kiểm tra đường dẫn thật.
    const realBaseDir = await fs.realpath(ALLOWED_BASE_DIR);
    const realFilePath = await fs.realpath(resolvedPath);
    const relative = path.relative(realBaseDir, realFilePath);
    const isOutside = relative.startsWith("..") || path.isAbsolute(relative);

    if (isOutside) {
      return {
        ok: false,
        error: `Truy cập bị từ chối: Đường dẫn '${filePath}' vượt ra ngoài phạm vi cho phép (src/).`,
      };
    }

    // 4. Đọc file khi đã xác minh an toàn
    const content = await fs.readFile(realFilePath, "utf-8");
    return { ok: true, content };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return { ok: false, error: errorMsg };
  }
}
