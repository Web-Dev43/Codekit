const tools = {
  qr: {
    title: "QR Code Generator",
    desc: "Turn text or a URL into a downloadable QR code.",
    render: () => `
      <div class="tool-card">
        <div class="tool-head"><h2>QR Code Generator</h2><p>Paste a URL or text, then tap Generate.</p></div>
        <div class="stack">
          <div><label for="qr-input">Text or URL</label><input id="qr-input" value="https://example.com" placeholder="https://example.com"></div>
          <div class="actions">
            <button class="btn" id="qr-generate" type="button">Generate QR Code</button>
            <button class="btn secondary" id="qr-download" type="button">Download PNG</button>
          </div>
          <div id="qr-status" class="status">Ready to generate.</div>
          <div class="result qr-wrap"><div id="qr-output" class="qr-box"><span>Your QR code will appear here</span></div></div>
        </div>
      </div>`,
    init: () => {
      const out = document.querySelector("#qr-output");
      const input = document.querySelector("#qr-input");
      const status = document.querySelector("#qr-status");
      const download = document.querySelector("#qr-download");

      const make = () => {
        out.innerHTML = "";
        if (typeof QRCode === "undefined") {
          status.className = "status bad";
          status.textContent = "QR engine failed to load.";
          out.textContent = "QR generator unavailable";
          return;
        }
        try {
          new QRCode(out, {
            text: input.value.trim() || " ",
            width: 220,
            height: 220,
            correctLevel: QRCode.CorrectLevel.M
          });
          status.className = "status good";
          status.textContent = "QR code generated ✓";
        } catch (error) {
          status.className = "status bad";
          status.textContent = "Could not generate QR code.";
          out.textContent = "Generation failed";
          throw error;
        }
      };

      document.querySelector("#qr-generate").addEventListener("click", make);
      download.addEventListener("click", () => {
        const img = out.querySelector("img");
        const canvas = out.querySelector("canvas");
        const src = img?.src || canvas?.toDataURL?.("image/png");
        if (!src) {
          status.className = "status bad";
          status.textContent = "Generate a QR code first.";
          return;
        }
        const link = document.createElement("a");
        link.href = src;
        link.download = "codekit-qr.png";
        link.click();
      });

      make();
    }
  },

  json: {
    title: "JSON Formatter",
    desc: "Format, validate, and minify JSON.",
    render: () => `
      <div class="tool-card">
        <div class="tool-head"><h2>JSON Formatter</h2><p>Pretty-print JSON or crush it back down to one line.</p></div>
        <label for="json-input">JSON</label>
        <textarea id="json-input">{&quot;hello&quot;:&quot;world&quot;,&quot;numbers&quot;:[1,2,3]}</textarea>
        <div class="actions">
          <button class="btn" id="json-format" type="button">Format</button>
          <button class="btn secondary" id="json-minify" type="button">Minify</button>
        </div>
        <div id="json-status" class="status"></div>
      </div>`,
    init: () => {
      const input = document.querySelector("#json-input");
      const status = document.querySelector("#json-status");
      const run = (pretty) => {
        try {
          const data = JSON.parse(input.value);
          input.value = JSON.stringify(data, null, pretty ? 2 : 0);
          status.className = "status good";
          status.textContent = "Valid JSON ✓";
        } catch (error) {
          status.className = "status bad";
          status.textContent = "Invalid JSON: " + error.message;
        }
      };
      document.querySelector("#json-format").addEventListener("click", () => run(true));
      document.querySelector("#json-minify").addEventListener("click", () => run(false));
    }
  },

  uuid: {
    title: "UUID Generator",
    desc: "Generate unique UUID v4 identifiers.",
    render: () => `
      <div class="tool-card">
        <div class="tool-head"><h2>UUID Generator</h2><p>Generate unique IDs for your projects.</p></div>
        <div class="result"><div id="uuid-value" class="big-value"></div></div>
        <div class="actions">
          <button class="btn" id="uuid-generate" type="button">Generate UUID</button>
          <button class="btn secondary" id="uuid-copy" type="button">Copy</button>
        </div>
        <div id="uuid-status" class="status"></div>
      </div>`,
    init: () => {
      const value = document.querySelector("#uuid-value");
      const status = document.querySelector("#uuid-status");
      const fallbackUuid = () => {
        const bytes = crypto.getRandomValues(new Uint8Array(16));
        bytes[6] = (bytes[6] & 15) | 64;
        bytes[8] = (bytes[8] & 63) | 128;
        const hex = [...bytes].map((x) => x.toString(16).padStart(2, "0")).join("");
        return hex.slice(0, 8) + "-" + hex.slice(8, 12) + "-" + hex.slice(12, 16) + "-" + hex.slice(16, 20) + "-" + hex.slice(20);
      };
      const make = () => {
        value.textContent = crypto.randomUUID ? crypto.randomUUID() : fallbackUuid();
        status.textContent = "";
      };
      document.querySelector("#uuid-generate").addEventListener("click", make);
      document.querySelector("#uuid-copy").addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(value.textContent);
          status.className = "status good";
          status.textContent = "Copied ✓";
        } catch {
          status.className = "status bad";
          status.textContent = "Copy failed. Select the UUID manually.";
        }
      });
      make();
    }
  },

  base64: {
    title: "Base64 Encoder / Decoder",
    desc: "Encode text to Base64 or decode Base64 back to text.",
    render: () => `
      <div class="tool-card">
        <div class="tool-head"><h2>Base64</h2><p>Encode or decode UTF-8 text.</p></div>
        <label for="b64-input">Input</label><textarea id="b64-input" placeholder="Type something..."></textarea>
        <div class="actions">
          <button class="btn" id="b64-encode" type="button">Encode</button>
          <button class="btn secondary" id="b64-decode" type="button">Decode</button>
        </div>
        <label for="b64-output">Output</label><textarea id="b64-output" readonly></textarea>
        <div id="b64-status" class="status"></div>
      </div>`,
    init: () => {
      const input = document.querySelector("#b64-input");
      const output = document.querySelector("#b64-output");
      const status = document.querySelector("#b64-status");
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();

      document.querySelector("#b64-encode").addEventListener("click", () => {
        const bytes = encoder.encode(input.value);
        let binary = "";
        bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
        output.value = btoa(binary);
        status.className = "status good";
        status.textContent = "Encoded ✓";
      });

      document.querySelector("#b64-decode").addEventListener("click", () => {
        try {
          const binary = atob(input.value.trim());
          const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
          output.value = decoder.decode(bytes);
          status.className = "status good";
          status.textContent = "Decoded ✓";
        } catch {
          status.className = "status bad";
          status.textContent = "Invalid Base64";
        }
      });
    }
  },

  url: {
    title: "URL Encoder",
    desc: "Safely encode or decode URL components.",
    render: () => `
      <div class="tool-card">
        <div class="tool-head"><h2>URL Encoder</h2><p>Handle spaces, symbols, and other URL characters.</p></div>
        <label for="url-input">Input</label><textarea id="url-input" placeholder="https://example.com/hello world?x=1&y=2"></textarea>
        <div class="actions">
          <button class="btn" id="url-encode" type="button">Encode</button>
          <button class="btn secondary" id="url-decode" type="button">Decode</button>
        </div>
        <label for="url-output">Output</label><textarea id="url-output" readonly></textarea>
        <div id="url-status" class="status"></div>
      </div>`,
    init: () => {
      const input = document.querySelector("#url-input");
      const output = document.querySelector("#url-output");
      const status = document.querySelector("#url-status");
      const run = (fn) => {
        try {
          output.value = fn(input.value);
          status.className = "status good";
          status.textContent = "Done ✓";
        } catch {
          status.className = "status bad";
          status.textContent = "Invalid URL text";
        }
      };
      document.querySelector("#url-encode").addEventListener("click", () => run(encodeURIComponent));
      document.querySelector("#url-decode").addEventListener("click", () => run(decodeURIComponent));
    }
  },

  color: {
    title: "Color Converter",
    desc: "Convert HEX colors to RGB and HSL.",
    render: () => `
      <div class="tool-card">
        <div class="tool-head"><h2>Color Converter</h2><p>Drop in a HEX color and get the common formats back.</p></div>
        <div class="row">
          <div><label for="color-input">HEX</label><input id="color-input" value="#63e6a3"></div>
          <div class="result" style="margin:0"><div id="color-values" class="big-value" style="font-size:15px"></div></div>
        </div>
        <div id="color-preview" class="color-preview"></div>
        <div id="color-status" class="status"></div>
      </div>`,
    init: () => {
      const input = document.querySelector("#color-input");
      const values = document.querySelector("#color-values");
      const preview = document.querySelector("#color-preview");
      const status = document.querySelector("#color-status");

      const run = () => {
        const hex = input.value.trim().replace("#", "");
        if (!/^[0-9a-fA-F]{6}$/.test(hex)) {
          status.className = "status bad";
          status.textContent = "Use a 6-digit HEX color, like #63e6a3.";
          return;
        }
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        const rr = r / 255;
        const gg = g / 255;
        const bb = b / 255;
        const max = Math.max(rr, gg, bb);
        const min = Math.min(rr, gg, bb);
        const delta = max - min;
        let h = 0;
        let s = 0;
        const l = (max + min) / 2;
        if (delta) {
          s = delta / (1 - Math.abs(2 * l - 1));
          if (max === rr) h = 60 * (((gg - bb) / delta) % 6);
          else if (max === gg) h = 60 * ((bb - rr) / delta + 2);
          else h = 60 * ((rr - gg) / delta + 4);
        }
        if (h < 0) h += 360;
        values.textContent = `RGB: ${r}, ${g}, ${b}\nHSL: ${Math.round(h)}°, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%`;
        preview.style.background = "#" + hex;
        status.className = "status good";
        status.textContent = "Valid color ✓";
      };

      input.addEventListener("input", run);
      run();
    }
  },

  timestamp: {
    title: "Timestamp Converter",
    desc: "Convert Unix timestamps to readable dates and back.",
    render: () => `
      <div class="tool-card">
        <div class="tool-head"><h2>Timestamp Converter</h2><p>Unix time, UTC date, and local date.</p></div>
        <div class="row">
          <div><label for="ts-input">Unix timestamp</label><input id="ts-input" inputmode="numeric" placeholder="1760000000"></div>
          <div><label for="date-input">ISO date</label><input id="date-input" placeholder="2026-10-05T12:00:00Z"></div>
        </div>
        <div class="actions">
          <button class="btn" id="ts-now" type="button">Use current time</button>
          <button class="btn secondary" id="ts-from-unix" type="button">Timestamp → Date</button>
          <button class="btn secondary" id="ts-from-date" type="button">Date → Timestamp</button>
        </div>
        <div id="ts-output" class="result"></div>
      </div>`,
    init: () => {
      const timestamp = document.querySelector("#ts-input");
      const dateInput = document.querySelector("#date-input");
      const output = document.querySelector("#ts-output");

      document.querySelector("#ts-now").addEventListener("click", () => {
        const now = Date.now();
        timestamp.value = Math.floor(now / 1000);
        dateInput.value = new Date(now).toISOString();
        output.textContent = "Current time loaded ✓";
      });

      document.querySelector("#ts-from-unix").addEventListener("click", () => {
        const number = Number(timestamp.value);
        if (!Number.isFinite(number)) {
          output.textContent = "Enter a valid Unix timestamp.";
          return;
        }
        const date = new Date(number * 1000);
        output.textContent = date.toString() + "\nUTC: " + date.toISOString();
      });

      document.querySelector("#ts-from-date").addEventListener("click", () => {
        const date = new Date(dateInput.value);
        if (Number.isNaN(date.getTime())) {
          output.textContent = "Enter a valid date.";
          return;
        }
        timestamp.value = Math.floor(date.getTime() / 1000);
        output.textContent = "Unix timestamp: " + timestamp.value;
      });
    }
  },

  shortener: {
    title: "URL Shortener",
    desc: "Turn long URLs into compact CodeKit links.",
    render: () => `
      <div class="tool-card">
        <div class="tool-head"><h2>URL Shortener</h2><p>Paste a long URL and CodeKit creates a short link automatically.</p></div>
        <div class="stack">
          <div><label for="shortener-input">Long URL</label><input id="shortener-input" type="url" placeholder="https://example.com/a/really/long/url"></div>
          <div class="actions"><button class="btn" id="shortener-create" type="button">Shorten URL</button></div>
          <div id="shortener-status" class="status"></div>
          <div id="shortener-result" class="result" hidden>
            <label for="shortener-output">Your short URL</label>
            <input id="shortener-output" readonly>
            <div class="actions">
              <button class="btn secondary" id="shortener-copy" type="button">Copy</button>
              <a id="shortener-open" class="btn secondary" target="_blank" rel="noopener">Open</a>
            </div>
            <div id="shortener-destination" class="status"></div>
          </div>
        </div>
      </div>`,
    init: () => {
      const input = document.querySelector("#shortener-input");
      const create = document.querySelector("#shortener-create");
      const status = document.querySelector("#shortener-status");
      const result = document.querySelector("#shortener-result");
      const output = document.querySelector("#shortener-output");
      const destination = document.querySelector("#shortener-destination");
      const open = document.querySelector("#shortener-open");
      const endpoint = "https://fbqzavqemtezakmmysak.supabase.co/functions/v1/shortener";

      create.addEventListener("click", async () => {
        const value = input.value.trim();
        if (!value) {
          status.className = "status bad";
          status.textContent = "Enter a URL first.";
          return;
        }
        try {
          const parsed = new URL(value);
          if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
        } catch {
          status.className = "status bad";
          status.textContent = "Enter a valid HTTP or HTTPS URL.";
          return;
        }

        create.disabled = true;
        status.className = "status";
        status.textContent = "Creating short link...";
        result.hidden = true;

        try {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: value })
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "Could not create link.");
          output.value = data.shortUrl;
          destination.textContent = "Destination: " + data.targetUrl;
          open.href = data.shortUrl;
          result.hidden = false;
          status.className = "status good";
          status.textContent = "Short link created ✓";
        } catch (error) {
          status.className = "status bad";
          status.textContent = error.message || "Shortener unavailable.";
        } finally {
          create.disabled = false;
        }
      });

      document.querySelector("#shortener-copy").addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(output.value);
          status.className = "status good";
          status.textContent = "Copied ✓";
        } catch {
          status.className = "status bad";
          status.textContent = "Copy failed. Select the link manually.";
        }
      });
    }
  }
};

const area = document.querySelector("#tool-area");
const pageTitle = document.querySelector("#page-title");

function openTool(name) {
  const tool = tools[name] || tools.qr;
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.tool === name);
  });
  pageTitle.textContent = tool.title;
  area.innerHTML = tool.render();
  if (typeof tool.init === "function") tool.init();
}

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => openTool(button.dataset.tool));
});

openTool("qr");
