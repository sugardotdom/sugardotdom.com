const fs = require('fs');
const path = require('path');

const files = fs.readdirSync('.').filter(f => f.endsWith('.html') && !f.includes('pi-session'));

const headInjection = `
    <!-- Apex Metadata & Favicon -->
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22 font-family=%22serif%22 fill=%22%23d90000%22>α</text></svg>">
    <meta property="og:title" content="α : the zero of a polynomial">
    <meta property="og:description" content="A simple but elegant orchestration of absolute dominance.">
    <meta name="twitter:title" content="α : the zero of a polynomial">
`;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Check if we already injected it
    if (!content.includes('Apex Metadata')) {
        // Insert right before </head>
        content = content.replace('</head>', headInjection + '\n</head>');
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated ${file}`);
    }
});
