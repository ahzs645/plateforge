import { registerTemplate } from '../core/registry';
import { cnTemplate } from './cn';
import { euTemplate } from './eu';
import { jpTemplate } from './jp';
import { usTemplate } from './us';

registerTemplate(usTemplate);
registerTemplate(euTemplate);
registerTemplate(cnTemplate);
registerTemplate(jpTemplate);
