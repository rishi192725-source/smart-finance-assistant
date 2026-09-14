const fs = require('fs');
const path = require('path');

const dashPath = path.join(__dirname, 'frontend/src/pages/Dashboard.tsx');
let dash = fs.readFileSync(dashPath, 'utf8');

// Dashboard Theme fixes
dash = dash.replace(/text-gray-800/g, 'text-slate-900');
dash = dash.replace(/font-semibold text-slate-900/g, 'font-bold text-slate-900');
dash = dash.replace(/bg-white p-6 rounded-2xl shadow-sm border border-gray-100/g, 'bg-white p-6 shadow-sm border border-slate-200/60 rounded-2xl');
dash = dash.replace(/bg-white rounded-2xl shadow-sm border border-gray-100 p-6/g, 'bg-white p-6 shadow-sm border border-slate-200/60 rounded-2xl');
dash = dash.replace(/bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden/g, 'bg-white shadow-sm border border-slate-200/60 rounded-2xl overflow-hidden');
dash = dash.replace(/text-gray-400 text-sm/g, 'text-slate-500 text-sm');
dash = dash.replace(/text-gray-400/g, 'text-slate-500');

// Table Headers and Dividers
dash = dash.replace(/bg-gray-50 text-gray-500 text-sm/g, 'bg-slate-50 text-slate-700 font-medium text-xs uppercase tracking-wider');
dash = dash.replace(/divide-y divide-gray-100/g, 'divide-y divide-slate-100');
dash = dash.replace(/px-6 py-8 text-center text-slate-500/g, 'px-6 py-8 text-center text-slate-500 text-sm');

fs.writeFileSync(dashPath, dash);


const cardPath = path.join(__dirname, 'frontend/src/components/SpendingForecastCard.tsx');
let card = fs.readFileSync(cardPath, 'utf8');

// Card Header Typography & Layout
card = card.replace(/text-lg font-semibold text-gray-800/g, 'text-lg font-bold text-slate-900');
card = card.replace(/<div className="flex gap-2">/g, '<div className="flex items-center gap-3">');

// Select input styling
card = card.replace(/bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none/g, 'border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none');

// Refresh Button styling
card = card.replace(/p-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors/g, 'p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors disabled:opacity-50');

// Predicted Amount Typography
card = card.replace(/text-4xl font-bold text-gray-800/g, 'text-3xl font-extrabold text-slate-950');

// Labels
card = card.replace(/text-gray-500 mb-1/g, 'text-slate-600 mb-1');

// Main Container
card = card.replace(/bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full relative/g, 'bg-white p-6 shadow-sm border border-slate-200/60 rounded-2xl flex flex-col h-full relative');

fs.writeFileSync(cardPath, card);

console.log('Styles updated.');
