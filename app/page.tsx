"use client";

import React, { useState, useEffect } from 'react';
import { 
  FileJson, Copy, Download, Moon, Sun, Languages, HelpCircle, ExternalLink, Heart, UploadCloud
} from "lucide-react";

export default function TextToJSONApp() {
  const [inputText, setInputText] = useState<string>("");
  const [jsonOutput, setJsonOutput] = useState<string>("");
  const [reverseText, setReverseText] = useState<string>("");
  const [mode, setMode] = useState<'toJS' | 'toText'>('toJS');
  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState<'ja' | 'en'>('ja');
  const [isMinified, setIsMinified] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const t = {
    ja: {
      title: "GD↔OB Converter",
      subtitle: "GDevelop × Obsidian Synergy",
      obsidianToJson: "Obsidian → JSON",
      jsonToObsidian: "JSON → Obsidian",
      input: "入力 (Input)",
      inputHint: "文字を入力するか、.mdファイルをドロップ",
      output: "出力プレビュー (Output)",
      copy: "コピー",
      copied: "コピーしました！",
      ready: "入力を待機中...",
      help: "このツールについて",
      helpText: "GDevelopの構造体や配列変数を、Obsidianのテキスト形式を使って視覚的にデザインするためのツールです。",
      syntax: "記述のルール",
      nesting: "配列と階層の作り方",
      nestingDesc: "行頭にハイフン『- 』がない場合、純粋な配列として出力されます。セリフの終わりなどに『 | 』を入れると1要素として区切られ、それまでの改行は維持されます。ハイフンがある場合は構造体になります。",
      links: "コミュニティ & リソース",
      extTitle: " GDevelop連携の要",
      extDesc: "JSONを読み込むには「JSON Resource Loading」拡張機能が必須です。",
      madeBy: "Made by"
    },
    en: {
      title: "GD↔OB Converter",
      subtitle: "GDevelop × Obsidian Synergy",
      obsidianToJson: "Obsidian to JSON",
      jsonToObsidian: "JSON to Obsidian",
      input: "INPUT",
      inputHint: "Type or drop a .md file",
      output: "OUTPUT PREVIEW",
      copy: "Copy",
      copied: "Copied!",
      ready: "Waiting...",
      help: "About Tool",
      helpText: "Design GDevelop structures and arrays visually using Obsidian-style text.",
      syntax: "Syntax",
      nesting: "Arrays & Nesting",
      nestingDesc: "No '-' at start = Pure Array. Ends with '|' to split elements. Newlines and '、' are preserved. With '-' = Structure mode.",
      links: "Resources",
      extTitle: " GDevelop Essential",
      extDesc: "Use 'JSON Resource Loading' extension.",
      madeBy: "Made by"
    }
  };

  const cur = t[lang];

  useEffect(() => {
    if (!inputText.trim()) {
      setJsonOutput("");
      setReverseText("");
      return;
    }
    if (mode === 'toJS') {
      convertToJson(inputText);
    } else {
      convertToText(inputText);
    }
  }, [inputText, mode]);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setInputText(event.target?.result as string);
      reader.readAsText(file);
    }
  };

  const highlightJSON = (json: string) => {
    if (!json || json === cur.ready || json.startsWith("//")) return json;
    const highlighted = json
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"(.*?)":/g, '<span style="color: #818cf8; font-weight: bold;">"$1"</span>:')
      .replace(/: "(.*?)"/g, ': <span style="color: #fb923c;">"$1"</span>')
      .replace(/ "(.*?)"/g, ' <span style="color: #fb923c;">"$1"</span>')
      .replace(/: (\d+)/g, ': <span style="color: #4ade80;">$1</span>')
      .replace(/: (true|false)/g, ': <span style="color: #f472b6;">$1</span>');
    return <div dangerouslySetInnerHTML={{ __html: highlighted }} style={{ whiteSpace: 'pre-wrap' }} />;
  };

  const convertToJson = (text: string) => {
    try {
      const lines = text.split('\n');
      const isRootArray = !lines[0].trim().startsWith('- ');
      const result: any = isRootArray ? [] : {};
      const stack: { indent: number; obj: any; type: 'object' | 'array'; buffer: string }[] = [
        { indent: -1, obj: result, type: isRootArray ? 'array' : 'object', buffer: "" }
      ];

      lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed && stack[stack.length - 1].type !== 'array') return;
        const indent = line.replace(/　/g, ' ').search(/\S/);
        let currentParent = stack[stack.length - 1];

        // 配列要素の処理（区切り文字を | に変更）
        if (currentParent.type === 'array' && !trimmed.startsWith('- ')) {
          if (trimmed.endsWith('|')) {
            const val = (currentParent.buffer + (currentParent.buffer ? "\n" : "") + trimmed.slice(0, -1)).trim();
            currentParent.obj.push(val);
            currentParent.buffer = "";
          } else {
            currentParent.buffer += (currentParent.buffer ? "\n" : "") + trimmed;
          }
          return;
        }

        while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
          const closed = stack.pop();
          if (closed?.type === 'array' && closed.buffer.trim()) closed.obj.push(closed.buffer.trim());
        }
        currentParent = stack[stack.length - 1];

        let content = trimmed.startsWith('- ') ? trimmed.substring(2).trim() : trimmed;
        let keyName = content;
        let finalValue: any;
        let isArrayField = false;

        if (content.includes(': ')) {
          const [k, v] = content.split(': ');
          keyName = k.trim();
          const raw = v.trim();
          if (raw.startsWith('#')) finalValue = Number(raw.substring(1));
          else if (raw === '@true') finalValue = true;
          else if (raw === '@false') finalValue = false;
          else finalValue = raw;
        } else {
          if (keyName.endsWith('[]')) {
            keyName = keyName.slice(0, -2);
            finalValue = [];
            isArrayField = true;
          } else {
            finalValue = {};
          }
        }

        if (Array.isArray(currentParent.obj)) currentParent.obj.push(finalValue);
        else currentParent.obj[keyName] = finalValue;

        if (typeof finalValue === 'object') {
          stack.push({ indent, obj: finalValue, type: isArrayField ? 'array' : 'object', buffer: "" });
        }
      });
      stack.forEach(s => { if(s.type === 'array' && s.buffer.trim()) s.obj.push(s.buffer.trim()); });
      setJsonOutput(JSON.stringify(result, null, 2));
    } catch (e) { setJsonOutput("// Error: Invalid Format"); }
  };

  const convertToText = (jsonStr: string) => {
    try {
      const obj = JSON.parse(jsonStr);
      let output = "";

      const process = (item: any, indent: number) => {
        const space = " ".repeat(indent < 0 ? 0 : indent);
        
        if (Array.isArray(item)) {
          item.forEach(val => {
            if (typeof val === 'object') {
              process(val, indent + 1);
            } else {
              // 逆変換時も区切り文字を | に
              output += `${space}${val}|\n`;
            }
          });
        } else if (typeof item === 'object' && item !== null) {
          Object.keys(item).forEach(key => {
            const val = item[key];
            if (Array.isArray(val)) {
              output += `${space}- ${key}[]\n`;
              process(val, indent + 2);
            } else if (typeof val === 'object' && val !== null) {
              output += `${space}- ${key}\n`;
              process(val, indent + 2);
            } else {
              let displayVal = val;
              if (typeof val === 'number') displayVal = `#${val}`;
              if (typeof val === 'boolean') displayVal = `@${val}`;
              output += `${space}- ${key}: ${displayVal}\n`;
            }
          });
        }
      };

      if (Array.isArray(obj)) process(obj, 0);
      else process(obj, 0);
      setReverseText(output.trim());
    } catch (e) { setReverseText("// Error: Invalid JSON"); }
  };

  const copyToClipboard = () => {
    const text = mode === 'toJS' ? jsonOutput : reverseText;
    if (!text) return;
    navigator.clipboard.writeText(text)
      .then(() => alert(cur.copied))
      .catch(() => alert("手動でコピーしてください"));
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: isDark ? '#0f172a' : '#f8fafc', color: isDark ? '#f1f5f9' : '#1e293b', transition: '0.3s' }}>
      <header style={{ padding: '12px 24px', borderBottom: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isDark ? '#1e293b' : 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#6366f1', padding: '6px', borderRadius: '8px', display: 'flex' }}><FileJson size={20} color="white" /></div>
          <div><div style={{ fontWeight: '900', fontSize: '16px' }}>{cur.title}</div><div style={{ fontSize: '10px', color: '#64748b' }}>{cur.subtitle}</div></div>
        </div>
        <div style={{ display: 'flex', gap: '4px', background: isDark ? '#0f172a' : '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
          <button onClick={() => setMode('toJS')} style={{ padding: '6px 14px', fontSize: '11px', borderRadius: '7px', border: 'none', background: mode === 'toJS' ? '#6366f1' : 'transparent', color: mode === 'toJS' ? 'white' : '#64748b', cursor: 'pointer', fontWeight: 'bold' }}>{cur.obsidianToJson}</button>
          <button onClick={() => setMode('toText')} style={{ padding: '6px 14px', fontSize: '11px', borderRadius: '7px', border: 'none', background: mode === 'toText' ? '#10b981' : 'transparent', color: mode === 'toText' ? 'white' : '#64748b', cursor: 'pointer', fontWeight: 'bold' }}>{cur.jsonToObsidian}</button>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setLang(lang === 'ja' ? 'en' : 'ja')} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><Languages size={18} /></button>
          <button onClick={() => setIsDark(!isDark)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>{isDark ? <Sun size={18} /> : <Moon size={18} />}</button>
          <button onClick={() => setShowHelp(!showHelp)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><HelpCircle size={20} /></button>
        </div>
      </header>

      <main style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: '16px', gap: '16px' }}>
      {showHelp && (
  <div style={{ position: 'absolute', top: '70px', right: '20px', width: '340px', maxHeight: '80vh', overflowY: 'auto', background: isDark ? '#1e293b' : 'white', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: '20px', padding: '24px', zIndex: 100, boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
    <h3 style={{ marginTop: 0, fontSize: '18px' }}>{cur.help}</h3>
    <p style={{ fontSize: '12px', lineHeight: '1.6', color: '#94a3b8', marginBottom: '20px' }}>{cur.helpText}</p>
    
    <h4 style={{ fontSize: '13px', margin: '16px 0 8px 0', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
      🚀 {cur.extTitle}
    </h4>
    <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
      <a href="https://wiki.gdevelop.io/gdevelop5/extensions/jsonresource-loader/" target="_blank" rel="noopener noreferrer" style={{ color: '#10b981', textDecoration: 'none', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
        JSON Resource Loading <ExternalLink size={12}/>
      </a>
      <p style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b', marginTop: '8px', lineHeight: '1.5' }}>
        GDevelopでJSONを読み込むにはこの拡張機能が必要です。
      </p>
    </div>

    <h4 style={{ fontSize: '13px', margin: '16px 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
      📏 {cur.nesting}
    </h4>
    <p style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.5', marginBottom: '12px' }}>{cur.nestingDesc}</p>
    
    <h4 style={{ fontSize: '13px', margin: '16px 0 8px 0' }}>{cur.syntax}</h4>
    <div style={{ background: isDark ? '#0f172a' : '#f1f5f9', padding: '12px', borderRadius: '10px', fontFamily: 'monospace', fontSize: '11px', color: '#64748b', lineHeight: '1.4', marginBottom: '20px' }}>
      - Key: Value (String)<br/>
      - Level: #99 (Number)<br/>
      - Active: @true (Boolean)<br/>
      - 末尾に「|」で配列区切り
    </div>

    {/* 公式解説ページへのリンクボタン */}
    <a 
      href="https://cratier-gd.blogspot.com/p/gdob-converter.html" 
      target="_blank" 
      rel="noopener noreferrer" 
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: '8px', 
        width: '100%', 
        padding: '12px', 
        borderRadius: '12px', 
        background: isDark ? '#334155' : '#f1f5f9', 
        color: isDark ? '#f1f5f9' : '#1e293b', 
        textDecoration: 'none', 
        fontSize: '13px', 
        fontWeight: 'bold',
        border: `1px solid ${isDark ? '#475569' : '#e2e8f0'}`,
        marginBottom: '10px',
        transition: '0.2s'
      }}
    >
      <ExternalLink size={14} /> 技術仕様・運用マニュアル
    </a>
    
    <button onClick={() => setShowHelp(false)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: '#6366f1', color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>Close</button>
  </div>
)}

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }} onDragOver={(e)=>{e.preventDefault(); setIsDragging(true)}} onDragLeave={()=>setIsDragging(false)} onDrop={handleFileDrop}>
          <p style={{ fontSize: '10px', fontWeight: '900', color: '#64748b', marginBottom: '8px' }}>{cur.input}</p>
          <div style={{ flex: 1, position: 'relative', display: 'flex' }}>
            <textarea style={{ flex: 1, padding: '24px', borderRadius: '20px', border: `2px dashed ${isDragging ? '#6366f1' : 'transparent'}`, background: isDark ? '#1e293b' : 'white', color: isDark ? '#e2e8f0' : '#1e293b', outline: 'none', fontFamily: 'monospace', resize: 'none' }} value={inputText} onChange={(e)=>setInputText(e.target.value)} placeholder={cur.inputHint} />
            {!inputText && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.3, textAlign: 'center' }}><UploadCloud size={40}/><p>{cur.inputHint}</p></div>}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <p style={{ fontSize: '10px', fontWeight: '900', color: mode === 'toJS' ? '#6366f1' : '#10b981' }}>{cur.output}</p>
            <button onClick={copyToClipboard} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><Copy size={18} /></button>
          </div>
          <div style={{ flex: 1, padding: '24px', borderRadius: '20px', background: isDark ? '#000' : '#f8fafc', border: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`, overflow: 'auto' }}>
            <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '14px' }}>
              {mode === 'toJS' ? highlightJSON(jsonOutput) : (reverseText || cur.ready)}
            </pre>
          </div>
        </div>
      </main>

      <footer style={{ padding: '12px 24px', fontSize: '11px', textAlign: 'center', borderTop: `1px solid ${isDark ? '#1e293b' : '#f1f5f9'}`, color: '#64748b' }}>
        {cur.madeBy} <a href="https://cratier-gd.blogspot.com/" style={{ color: '#6366f1', textDecoration: 'none' }}>Cratier</a> | Made with <Heart size={10} color="#ef4444" fill="#ef4444" /> Gemini
      </footer>
    </div>
  );
}