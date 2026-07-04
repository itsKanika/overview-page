const http = require("http");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const cheerio = require("cheerio");

const HOST = process.env.HOST || "0.0.0.0";
const PORT = process.env.PORT || 3100;
const PUBLIC_DIR = path.join(__dirname, "src");
const FAQ_URL = "https://samagama.in/internship/faq";
const CACHE_TTL_MS = 15 * 60 * 1000;
const trainingPath = path.join(__dirname, "data", "training.json");
const training = fs.existsSync(trainingPath)
  ? JSON.parse(fs.readFileSync(trainingPath, "utf8"))
  : {};

let faqCache = {
  data: null,
  fetchedAt: 0
};

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

const cleanText = (text) => text.replace(/\s+/g, " ").trim();

const getSection = ($, element) => {
  const heading = $(element).prevAll("h1, h2, h3, h4").first();
  return cleanText(heading.text().replace(/\s*§$/, "")) || "General";
};

const parseFaqs = (html) => {
  const $ = cheerio.load(html);
  const faqs = [];

  $("details").each((index, element) => {
    const rawQuestion = cleanText($(element).find("summary").first().text());
    const idMatch = rawQuestion.match(/^(\d+\.\d+)\s+(.+?)\s*(?:§)?$/);
    const id = idMatch ? idMatch[1] : String(index + 1);
    const question = cleanText((idMatch ? idMatch[2] : rawQuestion).replace(/\s*§$/, ""));
    const answer = cleanText(
      $(element)
        .find("p, li")
        .map((_, node) => $(node).text())
        .get()
        .join(" ")
    );
    const trained = training[id] || {};

    if (question && answer) {
      faqs.push({
        id,
        question,
        section: getSection($, element),
        answer,
        aliases: Array.isArray(trained.aliases) ? trained.aliases : [],
        voiceAnswer: trained.voiceAnswer || ""
      });
    }
  });

  return faqs;
};

const loadFaqs = async () => {
  if (faqCache.data && Date.now() - faqCache.fetchedAt < CACHE_TTL_MS) {
    return faqCache.data;
  }

  const { data } = await axios.get(FAQ_URL, { timeout: 15000 });
  const faqs = parseFaqs(data);
  if (!faqs.length) {
    throw new Error("No FAQ entries found on the live page");
  }

  faqCache = {
    data: faqs,
    fetchedAt: Date.now()
  };
  return faqs;
};

const sendJson = (res, status, payload) => {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  res.end(JSON.stringify(payload));
};

const server = http.createServer(async (req, res) => {
  const urlPath = req.url === "/" ? "/index.html" : req.url.split("?")[0];

  if (urlPath === "/api/faqs") {
    try {
      const faqs = await loadFaqs();
      return sendJson(res, 200, {
        source: FAQ_URL,
        fetchedAt: new Date(faqCache.fetchedAt).toISOString(),
        faqs
      });
    } catch (error) {
      if (faqCache.data) {
        return sendJson(res, 200, {
          source: FAQ_URL,
          fetchedAt: new Date(faqCache.fetchedAt).toISOString(),
          stale: true,
          faqs: faqCache.data
        });
      }

      return sendJson(res, 502, {
        error: "Could not fetch the live FAQ",
        message: error.message
      });
    }
  }

  const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(PUBLIC_DIR, safePath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404);
      return res.end("Not found");
    }

    res.writeHead(200, {
      "Content-Type": types[path.extname(filePath)] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff"
    });
    res.end(content);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Voice agent running at http://${HOST}:${PORT}`);
});
