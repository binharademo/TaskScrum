const fs = require('fs');

const data = fs.readFileSync('backlog-sample.csv', 'utf8');
const lines = data.split('\n').filter(line => line.trim() && !line.startsWith('ID') && !line.startsWith('﻿ID'));
const tasks = lines.map(line => {
  const cols = line.split(';');
  return {
    id: cols[0],
    epico: cols[1],
    userStory: cols[2],
    tela: cols[3],
    atividade: cols[4],
    tipoAtividade: cols[6],
    estimativa: parseInt(cols[7]) || 0,
    desenvolvedor: cols[8],
    sprint: cols[9],
    prioridade: cols[10],
    tamanhoStory: cols[11],
    horasMedidas: cols[14] || 0
  };
});

console.log('=== ANÁLISE DE DADOS PARA WIP CONTROL ===');
console.log('Total de tarefas:', tasks.length);
console.log('');

// Análise por desenvolvedor
const devStats = {};
tasks.forEach(task => {
  const dev = task.desenvolvedor?.trim() || 'Sem dev';
  if (!devStats[dev]) {
    devStats[dev] = { total: 0, estimativas: 0, tipos: {} };
  }
  devStats[dev].total++;
  devStats[dev].estimativas += task.estimativa;
  const tipo = task.tipoAtividade || 'Sem tipo';
  devStats[dev].tipos[tipo] = (devStats[dev].tipos[tipo] || 0) + 1;
});

console.log('=== DISTRIBUIÇÃO POR DESENVOLVEDOR ===');
Object.entries(devStats).forEach(([dev, stats]) => {
  console.log(`${dev}: ${stats.total} tarefas, ${stats.estimativas} horas estimadas`);
});
console.log('');

// Análise por épico  
const epicStats = {};
tasks.forEach(task => {
  const epico = task.epico || 'Sem épico';
  if (!epicStats[epico]) {
    epicStats[epico] = { total: 0, estimativas: 0, devs: new Set() };
  }
  epicStats[epico].total++;
  epicStats[epico].estimativas += task.estimativa;
  epicStats[epico].devs.add(task.desenvolvedor?.trim() || 'Sem dev');
});

console.log('=== DISTRIBUIÇÃO POR ÉPICO ===');
Object.entries(epicStats).forEach(([epico, stats]) => {
  console.log(`${epico}: ${stats.total} tarefas, ${stats.estimativas} horas, ${stats.devs.size} devs`);
});
console.log('');

// Análise por prioridade
const prioStats = {};
tasks.forEach(task => {
  const prio = task.prioridade || 'Sem prioridade';
  if (!prioStats[prio]) {
    prioStats[prio] = { total: 0, estimativas: 0 };
  }
  prioStats[prio].total++;
  prioStats[prio].estimativas += task.estimativa;
});

console.log('=== DISTRIBUIÇÃO POR PRIORIDADE ===');
Object.entries(prioStats).forEach(([prio, stats]) => {
  console.log(`${prio}: ${stats.total} tarefas, ${stats.estimativas} horas`);
});
console.log('');

// Análise por tamanho
const sizeStats = {};
tasks.forEach(task => {
  const size = task.tamanhoStory || 'Sem tamanho';
  if (!sizeStats[size]) {
    sizeStats[size] = { total: 0, estimativas: 0 };
  }
  sizeStats[size].total++;
  sizeStats[size].estimativas += task.estimativa;
});

console.log('=== DISTRIBUIÇÃO POR TAMANHO DE STORY ===');
Object.entries(sizeStats).forEach(([size, stats]) => {
  console.log(`${size}: ${stats.total} tarefas, ${stats.estimativas} horas`);
});