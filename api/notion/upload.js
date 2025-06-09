// /api/notion/upload.js
export default async function handler(req, res) {
  const { token, pageTitle, data } = req.body;

  const pageRes = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      parent: { type: 'page_id', page_id: '你的目标 Notion 页面 ID' },
      properties: {
        title: {
          title: [{ type: 'text', text: { content: pageTitle } }],
        },
      },
      children: data.map((item) => ({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content: JSON.stringify(item) } }],
        },
      })),
    }),
  });

  const result = await pageRes.json();
  res.status(200).json(result);
}
