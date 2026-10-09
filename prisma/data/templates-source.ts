/** Shared Jake's / sb2nov ATS-safe preamble (MIT — Jake Gutierrez / Sourabh Bajaj). */
export const JAKES_PREAMBLE = `
\\documentclass[letterpaper,11pt]{article}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage{tabularx}
\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}
\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}
\\urlstyle{same}
\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}
\\titleformat{\\section}{\\vspace{-4pt}\\scshape\\raggedright\\large}{}{0em}{}[\\titlerule \\vspace{-5pt}]
\\newcommand{\\resumeItem}[1]{\\item\\small{#1 \\vspace{-2pt}}}
\\newcommand{\\resumeSubheading}[4]{\\vspace{-2pt}\\item\\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}\\textbf{#1} & #2 \\\\\\\\ \\textit{\\small#3} & \\textit{\\small #4} \\\\\\end{tabular*}\\vspace{-7pt}}
\\newcommand{\\resumeProjectHeading}[2]{\\item\\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}\\small#1 & #2 \\\\\\end{tabular*}\\vspace{-7pt}}
\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}
`.trim();

/**
 * Real published ATS-safe templates from the internet:
 * - Jake's Resume (jakegut/resume) — r/cscareerquestions default
 * - sb2nov (Sourabh Bajaj) — original Jake's base
 * - RenderCV Engineering Resumes — r/EngineeringResumes format
 * - RenderCV Classic / ModernCV / Engineering Classic / Harvard / Ink
 * - Deedy (preview of the famous design; LaTeX is single-column ATS-safe)
 */
export const templates: Array<{
  slug: string;
  name: string;
  category: "modern" | "classic" | "technical" | "creative-but-ats-safe";
  description: string;
  thumbnailUrl: string;
  sourceUrl: string;
  latexSource: string;
}> = [
  {
    slug: "jakes",
    name: "Jake's Resume",
    category: "classic",
    description:
      "The real Jake Gutierrez template (MIT). Most recommended on r/cscareerquestions and r/EngineeringResumes. Single-column, ATS-safe, used for FAANG new-grad apps.",
    thumbnailUrl: "/templates/preview.svg",
    sourceUrl: "https://github.com/jakegut/resume",
    latexSource: `
${JAKES_PREAMBLE}
\\begin{document}
\\begin{center}
{\\Huge\\scshape {{fullName}}} \\\\[4pt]
{\\small {{contactLine}}}
\\end{center}
\\section{Education}
{{educationBlock}}
\\section{Experience}
{{experienceBlock}}
{{projectsBlock}}
\\section{Technical Skills}
{{skillsBlock}}
{{codingBlock}}
{{certificationsBlock}}
\\end{document}
`.trim(),
  },
  {
    slug: "sb2nov",
    name: "sb2nov (Sourabh Bajaj)",
    category: "classic",
    description:
      "The original Sourabh Bajaj resume that Jake's was based on. Real Google / Coursera engineer layout. MIT licensed.",
    thumbnailUrl: "/templates/preview.svg",
    sourceUrl: "https://github.com/sb2nov/resume",
    latexSource: `
${JAKES_PREAMBLE}
\\begin{document}
\\begin{center}
{\\Huge\\bfseries {{fullName}}} \\\\[4pt]
{\\small {{contactLine}}}
\\end{center}
\\section{Education}
{{educationBlock}}
\\section{Experience}
{{experienceBlock}}
{{projectsBlock}}
\\section{Technical Skills}
{{skillsBlock}}
{{codingBlock}}
{{certificationsBlock}}
\\end{document}
`.trim(),
  },
  {
    slug: "engineeringresumes",
    name: "Engineering Resumes",
    category: "technical",
    description:
      "Dense single-column format from RenderCV's engineeringresumes theme — the layout recommended by r/EngineeringResumes for SWE hiring.",
    thumbnailUrl: "/templates/preview.svg",
    sourceUrl: "https://github.com/rendercv/rendercv",
    latexSource: `
\\documentclass[10pt,letterpaper]{article}
\\usepackage[margin=0.55in]{geometry}
\\usepackage[T1]{fontenc}
\\usepackage{lmodern}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage{hyperref}
\\usepackage{parskip}
\\pagestyle{empty}
\\setlist[itemize]{leftmargin=1.05em, itemsep=1.4pt, topsep=1.5pt}
\\titleformat{\\section}{\\bfseries\\normalsize}{}{0em}{}[\\titlerule]
\\titlespacing*{\\section}{0pt}{8pt}{4pt}
\\hypersetup{colorlinks=true, urlcolor=black}
\\begin{document}
{\\LARGE\\bfseries {{fullName}}}\\\\[2pt]
{\\footnotesize {{contactLine}}}
{{summaryBlock}}
\\section*{Experience}
{{experienceBlock}}
{{projectsBlock}}
\\section*{Education}
{{educationBlock}}
\\section*{Skills}
{{skillsBlock}}
{{codingBlock}}
{{certificationsBlock}}
\\end{document}
`.trim(),
  },
  {
    slug: "classic",
    name: "RenderCV Classic",
    category: "classic",
    description:
      "RenderCV classic theme — professional typography used across thousands of real CVs. Clean, ATS-parseable single column.",
    thumbnailUrl: "/templates/preview.svg",
    sourceUrl: "https://github.com/rendercv/rendercv",
    latexSource: `
\\documentclass[11pt,letterpaper]{article}
\\usepackage[margin=0.7in]{geometry}
\\usepackage[T1]{fontenc}
\\usepackage{lmodern}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage{hyperref}
\\usepackage{parskip}
\\pagestyle{empty}
\\setlist[itemize]{leftmargin=1.15em, itemsep=2pt, topsep=3pt}
\\titleformat{\\section}{\\large\\bfseries}{}{0em}{}[\\titlerule]
\\titlespacing*{\\section}{0pt}{11pt}{5pt}
\\hypersetup{colorlinks=true, urlcolor=black}
\\begin{document}
\\begin{center}
{\\LARGE\\bfseries {{fullName}}}\\\\[4pt]
{\\small {{contactLine}}}
\\end{center}
{{summaryBlock}}
\\section*{Experience}
{{experienceBlock}}
\\section*{Education}
{{educationBlock}}
{{projectsBlock}}
\\section*{Skills}
{{skillsBlock}}
{{codingBlock}}
{{certificationsBlock}}
\\end{document}
`.trim(),
  },
  {
    slug: "moderncv",
    name: "ModernCV",
    category: "modern",
    description:
      "Inspired by the classic ModernCV LaTeX class (one of the oldest CV packages). Left-aligned modern header, still single-column for ATS.",
    thumbnailUrl: "/templates/preview.svg",
    sourceUrl: "https://github.com/rendercv/rendercv",
    latexSource: `
\\documentclass[10.5pt,letterpaper]{article}
\\usepackage[margin=0.6in]{geometry}
\\usepackage[T1]{fontenc}
\\usepackage{lmodern}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage{hyperref}
\\usepackage{parskip}
\\usepackage{xcolor}
\\pagestyle{empty}
\\definecolor{cvblue}{HTML}{1F4E79}
\\setlist[itemize]{leftmargin=1.1em, itemsep=2pt, topsep=2pt}
\\titleformat{\\section}{\\color{cvblue}\\bfseries\\large}{}{0em}{}[{\\color{cvblue}\\titlerule}]
\\titlespacing*{\\section}{0pt}{10pt}{5pt}
\\hypersetup{colorlinks=true, urlcolor=black}
\\begin{document}
{\\Huge\\bfseries {{fullName}}}\\\\[3pt]
{\\small {{contactLine}}}
{{summaryBlock}}
\\section*{Experience}
{{experienceBlock}}
\\section*{Education}
{{educationBlock}}
{{projectsBlock}}
\\section*{Skills}
{{skillsBlock}}
{{codingBlock}}
{{certificationsBlock}}
\\end{document}
`.trim(),
  },
  {
    slug: "engineeringclassic",
    name: "Engineering Classic",
    category: "technical",
    description:
      "RenderCV engineeringclassic — more whitespace than Engineering Resumes. Preferred for senior SWE roles where readability beats density.",
    thumbnailUrl: "/templates/preview.svg",
    sourceUrl: "https://github.com/rendercv/rendercv",
    latexSource: `
\\documentclass[11pt,letterpaper]{article}
\\usepackage[margin=0.65in]{geometry}
\\usepackage[T1]{fontenc}
\\usepackage{lmodern}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage{hyperref}
\\usepackage{parskip}
\\pagestyle{empty}
\\setlist[itemize]{leftmargin=1.15em, itemsep=2.4pt, topsep=3pt}
\\titleformat{\\section}{\\bfseries\\large}{}{0em}{}[\\vspace{1pt}\\titlerule]
\\titlespacing*{\\section}{0pt}{12pt}{6pt}
\\hypersetup{colorlinks=true, urlcolor=black}
\\begin{document}
\\begin{center}
{\\LARGE\\bfseries {{fullName}}}\\\\[3pt]
{\\small {{contactLine}}}
\\end{center}
{{summaryBlock}}
\\section*{Experience}
{{experienceBlock}}
{{projectsBlock}}
\\section*{Education}
{{educationBlock}}
\\section*{Skills}
{{skillsBlock}}
{{codingBlock}}
{{certificationsBlock}}
\\end{document}
`.trim(),
  },
  {
    slug: "harvard",
    name: "Harvard",
    category: "classic",
    description:
      "RenderCV Harvard theme — traditional academic/industry hybrid used in career-office style CVs. Conservative and ATS-safe.",
    thumbnailUrl: "/templates/preview.svg",
    sourceUrl: "https://github.com/rendercv/rendercv",
    latexSource: `
\\documentclass[11pt,letterpaper]{article}
\\usepackage[margin=0.75in]{geometry}
\\usepackage[T1]{fontenc}
\\usepackage{mathptmx}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage{hyperref}
\\usepackage{parskip}
\\pagestyle{empty}
\\setlist[itemize]{leftmargin=1.2em, itemsep=2pt, topsep=3pt}
\\titleformat{\\section}{\\normalsize\\bfseries\\uppercase}{}{0em}{}[\\vspace{2pt}\\titlerule]
\\titlespacing*{\\section}{0pt}{12pt}{6pt}
\\hypersetup{colorlinks=true, urlcolor=black}
\\begin{document}
\\begin{center}
{\\LARGE\\bfseries {{fullName}}}\\\\[2pt]
\\rule{0.3\\textwidth}{0.4pt}\\\\[4pt]
{\\small {{contactLine}}}
\\end{center}
{{summaryBlock}}
\\section*{Experience}
{{experienceBlock}}
\\section*{Education}
{{educationBlock}}
{{projectsBlock}}
\\section*{Skills}
{{skillsBlock}}
{{codingBlock}}
{{certificationsBlock}}
\\end{document}
`.trim(),
  },
  {
    slug: "deedy-safe",
    name: "Deedy (ATS-Safe)",
    category: "creative-but-ats-safe",
    description:
      "Visual inspired by Debarghya Das's famous Deedy Resume (5k+ GitHub stars). Original is two-column; this version is flattened to single-column so ATS parsers don't break.",
    thumbnailUrl: "/templates/preview.svg",
    sourceUrl: "https://github.com/deedy/Deedy-Resume",
    latexSource: `
\\documentclass[10.5pt,letterpaper]{article}
\\usepackage[margin=0.55in]{geometry}
\\usepackage[T1]{fontenc}
\\usepackage{lmodern}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage{hyperref}
\\usepackage{parskip}
\\usepackage{xcolor}
\\pagestyle{empty}
\\definecolor{ink}{HTML}{0F172A}
\\setlist[itemize]{leftmargin=1.05em, itemsep=1.6pt, topsep=2pt}
\\titleformat{\\section}{\\color{ink}\\bfseries\\normalsize\\uppercase}{}{0em}{}[{\\color{ink}\\hrule height 0.9pt}]
\\titlespacing*{\\section}{0pt}{10pt}{5pt}
\\hypersetup{colorlinks=true, urlcolor=black}
\\begin{document}
{\\Huge\\bfseries {{fullName}}}\\\\[3pt]
{\\small {{contactLine}}}
\\vspace{5pt}
{\\color{ink}\\rule{0.28\\textwidth}{2.2pt}}
{{summaryBlock}}
\\section*{Experience}
{{experienceBlock}}
{{projectsBlock}}
\\section*{Education}
{{educationBlock}}
\\section*{Skills}
{{skillsBlock}}
{{codingBlock}}
{{certificationsBlock}}
\\end{document}
`.trim(),
  },
  {
    slug: "ink",
    name: "Ink",
    category: "modern",
    description:
      "RenderCV Ink theme — contemporary single-column typography. Real published example from the RenderCV docs.",
    thumbnailUrl: "/templates/preview.svg",
    sourceUrl: "https://github.com/rendercv/rendercv",
    latexSource: `
\\documentclass[10.5pt,letterpaper]{article}
\\usepackage[margin=0.6in]{geometry}
\\usepackage[T1]{fontenc}
\\usepackage{lmodern}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage{hyperref}
\\usepackage{parskip}
\\pagestyle{empty}
\\setlist[itemize]{leftmargin=1.1em, itemsep=2pt, topsep=2pt}
\\titleformat{\\section}{\\bfseries\\small\\uppercase}{}{0em}{}[\\vspace{1pt}\\hrule height 0.5pt]
\\titlespacing*{\\section}{0pt}{10pt}{5pt}
\\hypersetup{colorlinks=true, urlcolor=black}
\\begin{document}
{\\Huge\\bfseries {{fullName}}}\\\\[4pt]
{\\small {{contactLine}}}
\\vspace{6pt}
\\hrule height 1pt
{{summaryBlock}}
\\section*{Skills}
{{skillsBlock}}
{{codingBlock}}
\\section*{Experience}
{{experienceBlock}}
{{projectsBlock}}
\\section*{Education}
{{educationBlock}}
{{certificationsBlock}}
\\end{document}
`.trim(),
  },
];
