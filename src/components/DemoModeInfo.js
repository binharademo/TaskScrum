import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Collapse,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckIcon,
  People as PeopleIcon,
  Assignment as TaskIcon,
  Timeline as TimelineIcon,
  Info as InfoIcon
} from '@mui/icons-material';

const DemoModeInfo = ({ demoDescription, onClose }) => {
  const [expanded, setExpanded] = useState(false);

  if (!demoDescription) return null;

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  return (
    <Card sx={{ mb: 2, backgroundColor: '#e8f5e8', border: '1px solid #4caf50' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            <InfoIcon sx={{ color: '#4caf50', mr: 1 }} />
            <Typography variant="h6" sx={{ color: '#2e7d32' }}>
              {demoDescription.title}
            </Typography>
            <Chip
              label="DEMO"
              color="success"
              size="small"
              sx={{ ml: 2, fontWeight: 'bold' }}
            />
          </Box>
          <Box>
            <IconButton onClick={handleToggle} size="small">
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
            <Button
              variant="outlined"
              size="small"
              onClick={onClose}
              sx={{ ml: 1 }}
            >
              Fechar
            </Button>
          </Box>
        </Box>

        <Typography variant="body2" sx={{ mt: 1, color: '#2e7d32' }}>
          {demoDescription.description}
        </Typography>

        <Collapse in={expanded}>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
              📋 Cenário de Demonstração
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {demoDescription.scenario}
            </Typography>

            <Box display="flex" gap={2} mb={2}>
              <Chip
                icon={<TimelineIcon />}
                label={demoDescription.duration}
                variant="outlined"
                size="small"
              />
              <Chip
                icon={<PeopleIcon />}
                label={demoDescription.team}
                variant="outlined"
                size="small"
              />
            </Box>

            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
              ✨ Funcionalidades Demonstradas
            </Typography>
            <List dense>
              {demoDescription.features.map((feature, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 30 }}>
                    <CheckIcon sx={{ color: '#4caf50', fontSize: 18 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={feature}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>

            <Divider sx={{ my: 2 }} />

            <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>
              💡 <strong>Dica:</strong> Use o botão "Zerar Atividades" (🗑️) no cabeçalho para limpar os dados demo e começar do zero.
            </Typography>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default DemoModeInfo;