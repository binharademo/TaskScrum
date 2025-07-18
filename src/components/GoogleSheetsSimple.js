import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Card,
  CardContent,
  Link,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  Google as GoogleIcon,
  PlayArrow as PlayIcon,
  OpenInNew as OpenIcon,
  ContentCopy as CopyIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';

const GoogleSheetsSimple = ({ onBackToLocal, onDemoMode }) => {
  const [step, setStep] = useState(0);
  const [csvData, setCsvData] = useState('');

  // Gerar dados CSV das tarefas atuais
  React.useEffect(() => {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    if (tasks.length > 0) {
      generateCSV(tasks);
    }
  }, []);

  const generateCSV = (tasks) => {
    const headers = [
      'ID', 'Épico', 'User Story', 'Atividade', 'Estimativa', 
      'Desenvolvedor', 'Sprint', 'Status', 'Prioridade',
      'Dia1', 'Dia2', 'Dia3', 'Dia4', 'Dia5',
      'Dia6', 'Dia7', 'Dia8', 'Dia9', 'Dia10',
      'Tempo Gasto', 'Taxa Erro', 'Criado em', 'Atualizado em'
    ];

    const rows = tasks.map(task => [
      task.id || '',
      task.epico || '',
      task.userStory || '',
      task.atividade || '',
      task.estimativa || 0,
      task.desenvolvedor || '',
      task.sprint || '',
      task.status || 'Backlog',
      task.prioridade || 'Média',
      ...(task.reestimativas || Array(10).fill(0)),
      task.tempoGasto || 0,
      task.taxaErro || 0,
      task.createdAt || new Date().toISOString(),
      task.updatedAt || new Date().toISOString()
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\\n');
    setCsvData(csv);
  };

  const downloadCSV = () => {
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TaskTracker_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setStep(1);
  };

  const createGoogleSheet = () => {
    // URL que cria uma nova planilha no Google Sheets
    const sheetUrl = 'https://docs.google.com/spreadsheets/create';
    window.open(sheetUrl, '_blank');
    setStep(2);
  };

  const copyCSVData = async () => {
    try {
      await navigator.clipboard.writeText(csvData);
      alert('Dados copiados! Cole na planilha do Google Sheets.');
    } catch (error) {
      // Fallback para navegadores mais antigos
      const textArea = document.createElement('textarea');
      textArea.value = csvData;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Dados copiados! Cole na planilha do Google Sheets.');
    }
  };

  const steps = [
    {
      label: 'Baixar seus dados',
      description: 'Primeiro, vamos baixar suas tarefas em formato CSV.'
    },
    {
      label: 'Criar planilha Google',
      description: 'Abra uma nova planilha no Google Sheets.'
    },
    {
      label: 'Importar dados',
      description: 'Importe o arquivo CSV na planilha.'
    }
  ];

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
      <Paper elevation={3} sx={{ p: 4, maxWidth: 600, textAlign: 'center' }}>
        <GoogleIcon sx={{ fontSize: 48, color: '#4285f4', mb: 2 }} />
        
        <Typography variant="h5" gutterBottom>
          Google Sheets - Modo Simples
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Integração super simples com Google Sheets em 3 passos
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
          <Typography variant="body2">
            ✅ <strong>100% Simples:</strong> Sem configuração<br/>
            ✅ <strong>Seus dados:</strong> Controle total<br/>
            ✅ <strong>Compartilhamento:</strong> Fácil com a equipe<br/>
            ✅ <strong>Sempre funciona:</strong> Sem dependências
          </Typography>
        </Alert>

        <Box sx={{ maxWidth: 500, mx: 'auto', mb: 3 }}>
          <Stepper activeStep={step} orientation="vertical">
            {steps.map((stepInfo, index) => (
              <Step key={stepInfo.label}>
                <StepLabel>
                  {stepInfo.label}
                </StepLabel>
                <StepContent>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {stepInfo.description}
                  </Typography>
                  
                  {index === 0 && (
                    <Button
                      variant="contained"
                      startIcon={<OpenIcon />}
                      onClick={downloadCSV}
                      sx={{ mr: 1 }}
                    >
                      Baixar CSV
                    </Button>
                  )}
                  
                  {index === 1 && (
                    <Button
                      variant="contained"
                      startIcon={<GoogleIcon />}
                      onClick={createGoogleSheet}
                      sx={{ mr: 1, backgroundColor: '#4285f4' }}
                    >
                      Criar Planilha
                    </Button>
                  )}
                  
                  {index === 2 && (
                    <Box>
                      <Button
                        variant="contained"
                        startIcon={<CopyIcon />}
                        onClick={copyCSVData}
                        sx={{ mr: 1 }}
                      >
                        Copiar Dados
                      </Button>
                      
                      <Alert severity="success" sx={{ mt: 2 }}>
                        <Typography variant="body2">
                          1. Na planilha, clique em <strong>Arquivo → Importar</strong><br/>
                          2. Escolha <strong>Colar</strong> ou selecione o arquivo CSV<br/>
                          3. Configure como <strong>Separado por vírgulas</strong><br/>
                          4. Pronto! Seus dados estão no Google Sheets
                        </Typography>
                      </Alert>
                    </Box>
                  )}
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </Box>

        {step >= 3 && (
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="body2">
              ✅ <strong>Sucesso!</strong> Seus dados estão no Google Sheets.<br/>
              Agora você pode compartilhar a planilha com sua equipe!
            </Typography>
          </Alert>
        )}
        
        <Box sx={{ mt: 3, display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button
            variant="outlined"
            onClick={onBackToLocal}
            sx={{ textTransform: 'none' }}
          >
            ← Voltar ao Modo Local
          </Button>
          
          <Button
            variant="contained"
            startIcon={<PlayIcon />}
            onClick={onDemoMode}
            sx={{
              backgroundColor: '#4caf50',
              '&:hover': { backgroundColor: '#45a049' },
              textTransform: 'none'
            }}
          >
            Modo Demo
          </Button>

          {step >= 1 && (
            <Button
              variant="outlined"
              startIcon={<CheckIcon />}
              onClick={() => setStep(step + 1)}
              disabled={step >= 2}
            >
              Próximo Passo
            </Button>
          )}
        </Box>
        
        <Typography variant="caption" display="block" sx={{ mt: 2, color: 'text.secondary' }}>
          💡 <strong>Dica:</strong> Para sincronizar de volta, exporte a planilha como CSV e importe no TaskTracker
        </Typography>
      </Paper>
    </Box>
  );
};

export default GoogleSheetsSimple;