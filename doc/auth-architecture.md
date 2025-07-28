# 🔐 ARQUITETURA DE AUTENTICAÇÃO - TaskTracker Supabase

## 📋 VISÃO GERAL DA AUTENTICAÇÃO

### **Abordagem: Híbrida com Flexibilidade Máxima**
```
Sem Auth (localStorage) ← → Com Auth (Supabase Multi-Room)
```

## 🎯 ESTRATÉGIAS DE AUTENTICAÇÃO

### **1. MODO ATUAL (Manter)**
- ✅ **Sem autenticação**: localStorage local
- ✅ **Salas temporárias**: RoomSelector atual
- ✅ **Dados locais**: Persiste no navegador
- ✅ **Compatibilidade**: Funciona offline

### **2. MODO SUPABASE (Novo)**
- ✅ **Autenticação opcional**: Login/Logout
- ✅ **Salas persistentes**: Multi-room por usuário
- ✅ **Compartilhamento**: Via room_code
- ✅ **Sincronização**: Dados na nuvem

---

## 🏗️ ARQUITETURA DE AUTENTICAÇÃO

### **Fluxo Principal**
```
App Start → Check Auth Status
    ↓
┌─────────────────┬─────────────────┐
│   NO AUTH       │   AUTHENTICATED │
│   (localStorage)│   (Supabase)    │
└─────────────────┴─────────────────┘
    ↓                     ↓
LocalStorageService   SupabaseService
    ↓                     ↓
Room local temp      Rooms persistentes
```

### **Componentes de Auth**

#### **AuthContext.js** - Gerenciamento Central
```javascript
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState('local'); // 'local' | 'supabase'

  // Supabase client
  const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.REACT_APP_SUPABASE_ANON_KEY
  );

  // Auth methods
  const signUp = async (email, password, options = {}) => { };
  const signIn = async (email, password) => { };
  const signInWithProvider = async (provider) => { }; // Google, GitHub
  const signOut = async () => { };
  const resetPassword = async (email) => { };
  
  // Mode switching
  const switchToSupabase = () => setAuthMode('supabase');
  const switchToLocal = () => setAuthMode('local');

  return (
    <AuthContext.Provider value={{
      // Auth state
      user, session, loading, authMode,
      
      // Auth methods
      signUp, signIn, signInWithProvider, signOut, resetPassword,
      
      // Mode switching
      switchToSupabase, switchToLocal,
      
      // Utilities
      isAuthenticated: !!user,
      isLocalMode: authMode === 'local'
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

#### **AuthGuard.js** - Proteção de Rotas
```javascript
const AuthGuard = ({ children, requireAuth = false }) => {
  const { isAuthenticated, isLocalMode, loading } = useAuth();

  if (loading) return <AuthLoadingSpinner />;

  // Se requer auth mas não está autenticado
  if (requireAuth && !isAuthenticated && !isLocalMode) {
    return <LoginPrompt />;
  }

  return children;
};
```

### **Integração com App.js**
```javascript
function App() {
  return (
    <AuthProvider>      {/* ← Nova camada */}
      <TaskProvider>
        <FilterProvider>
          <UIProvider>
            <AppContent />
          </UIProvider>
        </FilterProvider>
      </TaskProvider>
    </AuthProvider>
  );
}

function AppContent() {
  const { isAuthenticated, isLocalMode } = useAuth();
  
  // Escolher serviço baseado no modo
  const dataService = isAuthenticated && !isLocalMode 
    ? new SupabaseService() 
    : new LocalStorageService();

  return (
    <TaskServiceProvider service={dataService}>
      {/* Interface atual permanece igual */}
    </TaskServiceProvider>
  );
}
```

---

## 🔄 FLUXOS DE AUTENTICAÇÃO

### **Fluxo 1: Usuário Novo (Sem Auth)**
```
1. App.js carrega
2. AuthContext detecta: sem sessão
3. authMode = 'local'
4. Usa LocalStorageService
5. RoomSelector atual funciona normal
6. Botão "Upgrade para Supabase" disponível
```

### **Fluxo 2: Login pela Primeira Vez**
```
1. Usuário clica "Login/Signup"
2. Modal de autenticação abre
3. Escolhe: Email/Senha | Google | GitHub
4. Supabase autentica
5. authMode = 'supabase'
6. Troca para SupabaseService
7. Mostra salas do usuário (inicialmente vazia)
```

### **Fluxo 3: Usuário Retornando**
```
1. App.js carrega
2. AuthContext verifica localStorage/session
3. Supabase.auth.getSession() → válida
4. authMode = 'supabase'
5. Carrega user profile
6. Lista salas do usuário
```

### **Fluxo 4: Logout**
```
1. Usuário clica "Logout"
2. Supabase.auth.signOut()
3. Clear user state
4. authMode = 'local'
5. Volta para LocalStorageService
6. RoomSelector mostra salas locais
```

---

## 🎨 INTERFACE DE AUTH

### **Componente: AuthButton** (Header)
```javascript
const AuthButton = () => {
  const { user, isLocalMode, switchToSupabase, signOut } = useAuth();

  if (isLocalMode) {
    return (
      <Tooltip title="Fazer login para salvar na nuvem">
        <IconButton onClick={switchToSupabase}>
          <PersonIcon />
          <Typography variant="caption">Local</Typography>
        </IconButton>
      </Tooltip>
    );
  }

  if (user) {
    return (
      <Menu>
        <Avatar src={user.user_metadata?.avatar_url}>
          {user.email?.[0]?.toUpperCase()}
        </Avatar>
        <MenuItem>{user.email}</MenuItem>
        <MenuItem onClick={signOut}>Logout</MenuItem>
      </Menu>
    );
  }

  return <LoginButton />;
};
```

### **Modal: LoginModal**
```javascript
const LoginModal = ({ open, onClose }) => {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const { signIn, signUp, signInWithProvider } = useAuth();

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>
        {mode === 'login' ? 'Entrar' : 'Criar Conta'}
      </DialogTitle>
      
      <DialogContent>
        {/* Email/Password Form */}
        <EmailPasswordForm mode={mode} />
        
        <Divider sx={{ my: 2 }}>OU</Divider>
        
        {/* Social Login */}
        <Stack spacing={1}>
          <Button 
            variant="outlined" 
            startIcon={<GoogleIcon />}
            onClick={() => signInWithProvider('google')}
          >
            Continuar com Google
          </Button>
          
          <Button 
            variant="outlined" 
            startIcon={<GitHubIcon />}
            onClick={() => signInWithProvider('github')}
          >
            Continuar com GitHub
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};
```

---

## 🔒 CONFIGURAÇÃO SUPABASE AUTH

### **Providers Habilitados**
```javascript
// 1. Email/Password (padrão)
// 2. Google OAuth
// 3. GitHub OAuth

// supabase.auth.js config
const supabaseConfig = {
  auth: {
    redirectTo: 'http://localhost:3000/auth/callback',
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce' // Mais seguro
  }
};
```

### **User Metadata**
```javascript
// Dados salvos no auth.users
{
  id: "uuid",
  email: "user@email.com",
  user_metadata: {
    full_name: "João Silva",
    avatar_url: "https://...",
    provider: "google" | "github" | "email"
  },
  app_metadata: {
    // Dados internos do app
  }
}
```

---

## 🛡️ SEGURANÇA E RLS

### **Row Level Security por Usuário**
```sql
-- Todas as tabelas têm user_id/owner_id
-- RLS garante que usuário só vê seus dados

-- Exemplo: rooms table
CREATE POLICY "users_own_rooms" ON rooms
  FOR ALL USING (owner_id = auth.uid());

-- Exemplo: shared access
CREATE POLICY "users_access_shared_rooms" ON rooms
  FOR SELECT USING (
    id IN (
      SELECT room_id FROM room_access 
      WHERE user_id = auth.uid()
    )
  );
```

### **Session Management**
```javascript
// Auto-refresh de tokens
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed automatically');
  }
  
  if (event === 'SIGNED_OUT') {
    // Limpar dados locais
    clearLocalState();
  }
});
```

---

## 🔄 MIGRAÇÃO E COMPATIBILIDADE

### **Migração localStorage → Supabase**
```javascript
const migrateLocalToSupabase = async () => {
  const { user } = useAuth();
  if (!user) return;

  // 1. Ler dados locais
  const localTasks = loadTasksFromStorage();
  const localRooms = getRoomsFromStorage();

  // 2. Criar sala principal do usuário
  const mainRoom = await createRoom({
    name: 'Migração do Local',
    description: 'Dados migrados do localStorage'
  });

  // 3. Migrar tasks
  for (const task of localTasks) {
    await createTask({
      ...task,
      room_id: mainRoom.id,
      created_by: user.id
    });
  }

  // 4. Backup local (segurança)
  localStorage.setItem('migration_backup', JSON.stringify({
    tasks: localTasks,
    rooms: localRooms,
    migrated_at: new Date().toISOString()
  }));
};
```

### **Fallback para Offline**
```javascript
const TaskServiceProvider = ({ children }) => {
  const { isAuthenticated, isLocalMode } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Service selection logic
  const getService = () => {
    if (isLocalMode || !isAuthenticated || !isOnline) {
      return new LocalStorageService();
    }
    return new SupabaseService();
  };

  return (
    <TaskServiceContext.Provider value={getService()}>
      {children}
    </TaskServiceContext.Provider>
  );
};
```

---

## 🎯 VANTAGENS DESTA ARQUITETURA

### **1. Flexibilidade Total**
- ✅ **Usuário escolhe**: Local ou nuvem
- ✅ **Migração suave**: Dados preservados
- ✅ **Fallback robusto**: Funciona offline

### **2. Experiência Progressiva**
- ✅ **Zero friction**: Usar sem cadastro
- ✅ **Value proposition**: Login quando vê valor
- ✅ **Onboarding gradual**: Descobre features aos poucos

### **3. Compatibilidade**
- ✅ **Código existente**: Funciona sem mudanças
- ✅ **RoomSelector atual**: Continua funcionando
- ✅ **LocalStorageService**: Mantido como fallback

### **4. Escalabilidade**
- ✅ **Multi-tenant**: Isolamento por usuário
- ✅ **Performance**: RLS + indices otimizados
- ✅ **Colaboração**: Compartilhamento seguro

---

## 📋 IMPLEMENTAÇÃO STEP-BY-STEP

### **Fase 1: Base Auth**
1. ✅ AuthContext.js
2. ✅ LoginModal.js
3. ✅ AuthButton.js (Header)
4. ✅ Supabase config

### **Fase 2: Service Integration**
1. ✅ TaskServiceProvider
2. ✅ Service switching logic
3. ✅ Online/offline detection

### **Fase 3: Migration Tools**
1. ✅ Migration function
2. ✅ Backup system
3. ✅ User guidance

---

**🎯 RESUMO: Esta arquitetura mantém 100% da compatibilidade atual enquanto adiciona capacidades de nuvem opcionais e progressivas.**