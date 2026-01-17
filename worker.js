import { FFmpeg } from "https://unpkg.com/@ffmpeg/ffmpeg@0.12.6/dist/esm/index.js";
import { fetchFile } from "https://unpkg.com/@ffmpeg/util@0.12.6/dist/esm/index.js";

const ffmpeg = new FFmpeg();

self.onmessage = async (event) => {
  const { file, action } = event.data;

  if (action !== "convert") return;

  try {
    if (!ffmpeg.loaded) {
      await ffmpeg.load({
        coreURL: "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js"
      });
    }

    await ffmpeg.writeFile("input.mp4", await fetchFile(file));

    await ffmpeg.exec([
      "-i", "input.mp4",
      "-vn",
      "-acodec", "libmp3lame",
      "-ab", "192k",
      "output.mp3"
    ]);

    const data = await ffmpeg.readFile("output.mp3");

    self.postMessage({
      success: true,
      output: data.buffer
    }, [data.buffer]);

  } catch (err) {
    self.postMessage({
      success: false,
      error: err.message || String(err)
    });
  }
};
