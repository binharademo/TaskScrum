/**
 * Utilitários para detecção de primeiro acesso e wizard de boas-vindas
 */

/**
 * Verifica se é o primeiro acesso do usuário
 * @returns {boolean} true se for primeiro acesso
 */
export const isFirstAccess = () => {
  try {
    // Verificar se o wizard foi concluído
    const wizardCompleted = localStorage.getItem('tasktracker_wizard_completed');
    if (wizardCompleted === 'true') {
      return false;
    }

    // Verificar se existe algum dado do TaskTracker no localStorage
    const hasExistingData = checkExistingData();
    
    // Se tem dados mas não completou wizard, não é primeiro acesso
    // (usuário antigo que atualizou o sistema)
    if (hasExistingData) {
      console.log('🔍 firstAccess - Usuário existente detectado, marcando wizard como completo');
      localStorage.setItem('tasktracker_wizard_completed', 'true');
      return false;
    }

    console.log('🎉 firstAccess - Primeiro acesso detectado!');
    return true;
  } catch (error) {
    console.error('Erro ao verificar primeiro acesso:', error);
    return false;
  }
};

/**
 * Verifica se existem dados do TaskTracker no localStorage
 * @returns {boolean} true se existem dados
 */
const checkExistingData = () => {
  try {
    const keys = Object.keys(localStorage);
    
    // Padrões de chaves do TaskTracker
    const taskTrackerPatterns = [
      'tasktracker_room_',       // Dados de salas
      'tasktracker_tasks_',      // Dados de tarefas (padrão antigo)
      'tasktracker_current_room', // Sala atual
      'tasktracker_wip_limits',  // Limites WIP
      'tasktracker_user_settings' // Configurações do usuário
    ];

    // Verificar se existe alguma chave que corresponde aos padrões
    const hasData = keys.some(key => 
      taskTrackerPatterns.some(pattern => key.startsWith(pattern))
    );

    console.log('🔍 checkExistingData - Chaves encontradas:', keys.length);
    console.log('🔍 checkExistingData - Dados TaskTracker encontrados:', hasData);
    
    return hasData;
  } catch (error) {
    console.error('Erro ao verificar dados existentes:', error);
    return false;
  }
};

/**
 * Marca o wizard como concluído
 * @param {Object} result - Resultado da configuração do wizard
 */
export const markWizardCompleted = (result) => {
  try {
    localStorage.setItem('tasktracker_wizard_completed', 'true');
    localStorage.setItem('tasktracker_wizard_result', JSON.stringify(result));
    console.log('✅ firstAccess - Wizard marcado como concluído:', result);
  } catch (error) {
    console.error('Erro ao marcar wizard como concluído:', error);
  }
};

/**
 * Obtém o resultado do wizard
 * @returns {Object|null} Resultado do wizard ou null se não completou
 */
export const getWizardResult = () => {
  try {
    const result = localStorage.getItem('tasktracker_wizard_result');
    return result ? JSON.parse(result) : null;
  } catch (error) {
    console.error('Erro ao obter resultado do wizard:', error);
    return null;
  }
};

/**
 * Reseta o estado do wizard (para testes ou reset do sistema)
 */
export const resetWizard = () => {
  try {
    localStorage.removeItem('tasktracker_wizard_completed');
    localStorage.removeItem('tasktracker_wizard_result');
    console.log('🔄 firstAccess - Wizard resetado');
  } catch (error) {
    console.error('Erro ao resetar wizard:', error);
  }
};

/**
 * Obtém estatísticas sobre o estado do localStorage
 * @returns {Object} Objeto com estatísticas
 */
export const getStorageStats = () => {
  try {
    const keys = Object.keys(localStorage);
    const taskTrackerKeys = keys.filter(key => key.startsWith('tasktracker_'));
    
    return {
      totalKeys: keys.length,
      taskTrackerKeys: taskTrackerKeys.length,
      keys: taskTrackerKeys,
      wizardCompleted: localStorage.getItem('tasktracker_wizard_completed') === 'true',
      wizardResult: getWizardResult()
    };
  } catch (error) {
    console.error('Erro ao obter estatísticas do storage:', error);
    return {
      totalKeys: 0,
      taskTrackerKeys: 0,
      keys: [],
      wizardCompleted: false,
      wizardResult: null
    };
  }
};