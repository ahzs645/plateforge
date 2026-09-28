import { registerTemplate } from '../core/registry';
import { bcTemplate } from './bc';
import { cnTemplate } from './cn';
import { euTemplate } from './eu';
import { iqTemplate } from './iq';
import { irTemplate } from './ir';
import { jpTemplate } from './jp';
import { usTemplate } from './us';

registerTemplate(usTemplate);
registerTemplate(euTemplate);
registerTemplate(cnTemplate);
registerTemplate(jpTemplate);
registerTemplate(bcTemplate);
registerTemplate(iqTemplate);
registerTemplate(irTemplate);
