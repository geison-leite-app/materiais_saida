import './ui/styles/tokens.css';
import './ui/styles/base.css';
import './ui/styles/components.css';
import './ui/styles/scanner.css';

import { criarFixtureMaterialRepository } from './adapters/repositories/fixture-material-repository.js';
import { initTheme } from './app/theme.js';
import { criarBuscarMaterialPorCodigo } from './core/usecases/buscar-material-por-codigo.js';
import { createScannerScreen } from './ui/screens/scanner-screen.js';

initTheme();

// Composition root: aqui (e só aqui) escolhemos as implementações concretas.
const materialRepository = criarFixtureMaterialRepository();
const buscarMaterialPorCodigo = criarBuscarMaterialPorCodigo({ materialRepository });

const screen = createScannerScreen({ buscarMaterialPorCodigo });
document.querySelector('#app').append(screen.element);
