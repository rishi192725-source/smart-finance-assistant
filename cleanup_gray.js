const fs = require('fs');
const path = require('path');

const dashPath = path.join(__dirname, 'frontend/src/pages/Dashboard.tsx');
let dash = fs.readFileSync(dashPath, 'utf8');

dash = dash.replace(/text-gray-400/g, 'text-slate-400');
dash = dash.replace(/text-gray-500/g, 'text-slate-500');
dash = dash.replace(/text-gray-600/g, 'text-slate-600');
dash = dash.replace(/text-gray-700/g, 'text-slate-700');
dash = dash.replace(/text-gray-800/g, 'text-slate-900');
dash = dash.replace(/text-gray-900/g, 'text-slate-950');

dash = dash.replace(/bg-gray-50/g, 'bg-slate-50');
dash = dash.replace(/bg-gray-100/g, 'bg-slate-100');
dash = dash.replace(/bg-gray-200/g, 'bg-slate-200');

dash = dash.replace(/border-gray-100/g, 'border-slate-100');
dash = dash.replace(/border-gray-200/g, 'border-slate-200');
dash = dash.replace(/border-gray-300/g, 'border-slate-300');

fs.writeFileSync(dashPath, dash);
console.log('Dashboard clean up done.');

const cardPath = path.join(__dirname, 'frontend/src/components/SpendingForecastCard.tsx');
let card = fs.readFileSync(cardPath, 'utf8');

card = card.replace(/text-gray-400/g, 'text-slate-400');
card = card.replace(/text-gray-500/g, 'text-slate-500');
card = card.replace(/text-gray-600/g, 'text-slate-600');
card = card.replace(/text-gray-700/g, 'text-slate-700');
card = card.replace(/text-gray-800/g, 'text-slate-900');

card = card.replace(/bg-gray-50/g, 'bg-slate-50');
card = card.replace(/bg-gray-100/g, 'bg-slate-100');

card = card.replace(/border-gray-100/g, 'border-slate-100');
card = card.replace(/border-gray-200/g, 'border-slate-200');

fs.writeFileSync(cardPath, card);
console.log('Card clean up done.');
