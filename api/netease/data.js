// pages/api/netease/data.js
export default async function handler(req, res) {
  const { type, id } = req.query;

  if (!type || !id) {
    return res.status(400).json({ error: "Missing type or id" });
  }

  let apiUrl = "";

  switch (type) {
    case "playlist":
      apiUrl = `https://netease-cloud-music-api-tau-one-92.vercel.app/playlist/detail?id=${id}`;
      break;
    case "song":
      apiUrl = `https://netease-cloud-music-api-tau-one-92.vercel.app/song/detail?ids=${id}`;
      break;
    case "album":
      apiUrl = `https://netease-cloud-music-api-tau-one-92.vercel.app/album?id=${id}`;
      break;
    default:
      return res.status(400).json({
        error: "Invalid type. Use: playlist, song, or album",
      });
  }

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch data from Netease API",
      detail: error.message,
    });
  }
}
