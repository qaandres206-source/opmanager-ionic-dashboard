import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { Logger } from './app/core/utils/logger';

if (environment.production) {
  enableProdMode();
  // Disable console in production for security
  Logger.disableConsoleInProduction();
}

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch(err => Logger.error('Bootstrap error:', err));
