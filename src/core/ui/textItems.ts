import { PremiumPlan, type Relationship, RELATIONSHIPS } from '../model';
import { itemOf, type UiText } from './uiText';

/* Names of model enums. These are string enums, so their array index comes from an order table. */

const PREMIUM_PLANS: readonly PremiumPlan[] = [PremiumPlan.YEARLY, PremiumPlan.MONTHLY];

export const relationshipName = (t: UiText, relationship: Relationship): string =>
  itemOf(t.ta('relationships'), RELATIONSHIPS.indexOf(relationship));

export const premiumPlanName = (t: UiText, plan: PremiumPlan): string =>
  itemOf(t.ta('premium_plans'), PREMIUM_PLANS.indexOf(plan));
