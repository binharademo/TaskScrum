import { GOOGLE_CONFIG } from '../config/googleConfig';

class GoogleAuthService {
  constructor() {
    this.gapi = null;
    this.authInstance = null;
    this.currentUser = null;
    this.isInitialized = false;
  }

  // Inicializar Google API
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Carregar Google API
      await this.loadGoogleAPI();
      
      // Inicializar gapi
      await window.gapi.load('auth2', async () => {
        await window.gapi.auth2.init({
          client_id: GOOGLE_CONFIG.CLIENT_ID,
          scope: GOOGLE_CONFIG.SCOPES.join(' ')
        });
        
        this.authInstance = window.gapi.auth2.getAuthInstance();
        this.isInitialized = true;
        
        // Verificar se já está logado
        if (this.authInstance.isSignedIn.get()) {
          this.currentUser = this.authInstance.currentUser.get();
        }
      });
      
    } catch (error) {
      console.error('Erro ao inicializar Google Auth:', error);
      throw new Error('Falha na inicialização do Google Auth');
    }
  }

  // Carregar Google API dinamicamente
  loadGoogleAPI() {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        try {
          window.gapi.load('client:auth2', resolve);
        } catch (error) {
          reject(error);
        }
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Fazer login
  async signIn() {
    try {
      await this.initialize();
      
      if (this.authInstance.isSignedIn.get()) {
        return this.getCurrentUser();
      }
      
      const user = await this.authInstance.signIn();
      this.currentUser = user;
      
      return this.getCurrentUser();
    } catch (error) {
      console.error('Erro no login:', error);
      throw new Error('Falha no login com Google');
    }
  }

  // Fazer logout
  async signOut() {
    try {
      if (this.authInstance) {
        await this.authInstance.signOut();
        this.currentUser = null;
      }
    } catch (error) {
      console.error('Erro no logout:', error);
      throw new Error('Falha no logout');
    }
  }

  // Obter usuário atual
  getCurrentUser() {
    if (!this.currentUser) return null;
    
    const profile = this.currentUser.getBasicProfile();
    const authResponse = this.currentUser.getAuthResponse();
    
    return {
      id: profile.getId(),
      email: profile.getEmail(),
      name: profile.getName(),
      imageUrl: profile.getImageUrl(),
      accessToken: authResponse.access_token,
      isSignedIn: true
    };
  }

  // Verificar se está logado
  isSignedIn() {
    return this.authInstance && this.authInstance.isSignedIn.get();
  }

  // Obter token de acesso
  getAccessToken() {
    if (!this.currentUser) return null;
    return this.currentUser.getAuthResponse().access_token;
  }

  // Renovar token se necessário
  async refreshToken() {
    if (!this.currentUser) return null;
    
    try {
      const authResponse = await this.currentUser.reloadAuthResponse();
      return authResponse.access_token;
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      return null;
    }
  }
}

// Instância singleton
export const googleAuth = new GoogleAuthService();
export default googleAuth;