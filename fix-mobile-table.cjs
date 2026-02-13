// Quick script to fix mobile table
const fs = require('fs');

const filePath = './src/components/AttendanceReportExcel.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace table classes for mobile responsiveness
content = content.replace(
    '<table className="w-full border-collapse">',
    '<table className="w-full border-collapse text-[9px] sm:text-xs md:text-sm">'
);

// Fix sticky column z-index and shadow
content = content.replace(
    /sticky left-0 bg-\[#F39C32\] z-10/g,
    'sticky left-0 bg-[#F39C32] z-20 shadow-[3px_0_8px_rgba(0,0,0,0.15)]'
);

content = content.replace(
    /sticky left-\[40px\] bg-\[#F39C32\] z-10/g,
    'sticky left-[28px] sm:left-[40px] bg-[#F39C32] z-20 shadow-[3px_0_8px_rgba(0,0,0,0.15)]'
);

content = content.replace(
    /sticky left-0 bg-white/g,
    'sticky left-0 bg-white z-10 shadow-[3px_0_5px_rgba(0,0,0,0.1)]'
);

content = content.replace(
    /sticky left-\[40px\] bg-white/g,
    'sticky left-[28px] sm:left-[40px] bg-white z-10 shadow-[3px_0_5px_rgba(0,0,0,0.1)]'
);

// Make cells smaller on mobile
content = content.replace(/px-2 py-2 text-xs/g, 'px-1 sm:px-2 py-1 sm:py-2 text-[9px] sm:text-xs');
content = content.replace(/px-4 py-2 text-xs/g, 'px-2 sm:px-4 py-1 sm:py-2 text-[9px] sm:text-xs');
content = content.replace(/px-3 py-2 text-xs/g, 'px-1 sm:px-3 py-1 sm:py-2 text-[9px] sm:text-xs');
content = content.replace(/px-2 py-1 text-\[10px\]/g, 'px-1 sm:px-2 py-0.5 sm:py-1 text-[8px] sm:text-[10px]');

fs.writeFileSync(filePath, content);
console.log('✅ Mobile table fixed!');
