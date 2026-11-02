import { Element } from '../../engine';
import { ElementColors, type ToneColors } from '../../designsystem/theme/colors';

const ELEMENT_COLORS: Readonly<Record<Element, ToneColors>> = {
  [Element.WOOD]: ElementColors.wood,
  [Element.FIRE]: ElementColors.fire,
  [Element.EARTH]: ElementColors.earth,
  [Element.METAL]: ElementColors.metal,
  [Element.WATER]: ElementColors.water,
};

/** Theme colours for a five-phase element, used for glyphs, tags and swatches. */
export const elementColors = (element: Element): ToneColors => ELEMENT_COLORS[element];
