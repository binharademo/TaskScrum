import React, { useState } from 'react';
import {
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Tooltip,
  Box,
  Typography,
  Divider
} from '@mui/material';
import {
  Person as PersonIcon,
  Logout as LogoutIcon,
  AccountCircle as AccountIcon,
  Cloud as CloudIcon,
  CloudOff as CloudOffIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import LoginModal from './LoginModal';

const AuthButton = () => {
  const { 
    user, 
    isAuthenticated, 
    isLocalMode, 
    canUseSupabase,
    loading,
    signOut,
    switchToSupabase,
    switchToLocal 
  } = useAuth();

  const [anchorEl, setAnchorEl] = useState(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const menuOpen = Boolean(anchorEl);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = async () => {
    handleMenuClose();
    await signOut();
  };

  const handleSwitchToSupabase = () => {
    handleMenuClose();
    if (canUseSupabase) {
      setLoginModalOpen(true);
    }
  };

  const handleSwitchToLocal = () => {
    handleMenuClose();
    switchToLocal();
  };

  // Loading state
  if (loading) {
    return (
      <Chip
        size="small"
        label="Carregando..."
        variant="outlined"
        sx={{ ml: 1 }}
      />
    );
  }

  // Local mode - not authenticated
  if (isLocalMode && !isAuthenticated) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip
          icon={<CloudOffIcon />}
          label="Local"
          size="small"
          variant="outlined"
          color="default"
        />
        
        {canUseSupabase && (
          <Tooltip title="Fazer login para salvar na nuvem">
            <IconButton
              size="small"
              onClick={handleSwitchToSupabase}
              color="primary"
            >
              <PersonIcon />
            </IconButton>
          </Tooltip>
        )}

        <LoginModal 
          open={loginModalOpen}
          onClose={() => setLoginModalOpen(false)}
        />
      </Box>
    );
  }

  // Authenticated with Supabase
  if (isAuthenticated && user) {
    const displayName = user.user_metadata?.full_name || 
                       user.user_metadata?.name || 
                       user.email?.split('@')[0] || 
                       'Usuário';
    
    const avatarUrl = user.user_metadata?.avatar_url;
    const initials = displayName?.charAt(0)?.toUpperCase() || 'U';

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip
          icon={<CloudIcon />}
          label="Nuvem"
          size="small"
          color="success"
          variant="filled"
        />

        <Tooltip title={`${displayName} (${user.email})`}>
          <IconButton
            onClick={handleMenuOpen}
            size="small"
            sx={{ ml: 1 }}
          >
            <Avatar 
              src={avatarUrl}
              sx={{ width: 32, height: 32, fontSize: '0.875rem' }}
            >
              {initials}
            </Avatar>
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={anchorEl}
          open={menuOpen}
          onClose={handleMenuClose}
          onClick={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            sx: { minWidth: 220 }
          }}
        >
          {/* User Info */}
          <MenuItem disabled>
            <ListItemIcon>
              <Avatar src={avatarUrl} sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                {initials}
              </Avatar>
            </ListItemIcon>
            <ListItemText>
              <Typography variant="body2" noWrap>
                {displayName}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {user.email}
              </Typography>
            </ListItemText>
          </MenuItem>

          <Divider />

          {/* Profile Settings */}
          <MenuItem onClick={() => {/* TODO: Open profile settings */}}>
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Configurações</ListItemText>
          </MenuItem>

          {/* Account Info */}
          <MenuItem onClick={() => {/* TODO: Open account info */}}>
            <ListItemIcon>
              <AccountIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Minha Conta</ListItemText>
          </MenuItem>

          <Divider />

          {/* Switch to Local */}
          <MenuItem onClick={handleSwitchToLocal}>
            <ListItemIcon>
              <CloudOffIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Usar Modo Local</ListItemText>
          </MenuItem>

          {/* Sign Out */}
          <MenuItem onClick={handleSignOut}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Sair</ListItemText>
          </MenuItem>
        </Menu>
      </Box>
    );
  }

  // Fallback - should not happen
  return (
    <Chip
      icon={<PersonIcon />}
      label="Auth"
      size="small"
      variant="outlined"
      onClick={handleSwitchToSupabase}
    />
  );
};

export default AuthButton;