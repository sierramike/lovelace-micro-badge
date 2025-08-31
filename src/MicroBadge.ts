/* eslint-disable @typescript-eslint/no-explicit-any */
import {css, CSSResult, html, LitElement, PropertyValues, TemplateResult} from 'lit';
import {customElement, property, state} from 'lit/decorators';
import {HomeAssistant, fireEvent} from 'custom-card-helpers';

import {CARD_VERSION} from './const';
import IMicroBadgeConfig from './IMicroBadgeConfig';

/* eslint no-console: 0 */
console.info(
    `%c  Micro Badge \n%c  Version ${CARD_VERSION}    `,
    'color: orange; font-weight: bold; background: black',
    'color: white; font-weight: bold; background: dimgray',
);

// This puts your card into the UI card picker dialog
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
    type: 'micro-badge',
    name: 'MicroBadge',
    description: 'Tiny badge for Home Assistant Picture Elements',
});

@customElement('micro-badge')
export class MicroBadge extends LitElement {
    @property({attribute: false}) public hass!: HomeAssistant;
    @state() private _sDate = '';
    @state() private _sTime = '';
    @state() private _config?: IMicroBadgeConfig;
    @state() private _interval = 1000;
    private _intervalId?: number;

    public setConfig(config: IMicroBadgeConfig): void {
        this._config = { ...config };
    }

    protected shouldUpdate(changedProps: PropertyValues): boolean {
        return changedProps.has('_sDate') || changedProps.has('_sTime') || changedProps.has('_config') || changedProps.has('hass');
    }

    public async getCardSize(): Promise<number> {
        return 3;
    }

    protected _executeAction(item: IMicroBadgeConfig): void {
        if (item.action == undefined)
            return;

        try {
          switch (item.action) {
            case 'navigate':
              this._executeActionNavigate(item);
              break;
            case 'url':
              this._executeActionUrl(item);
              break;
            case 'toggle':
              this._executeActionToggle(item);
              break;
            case 'call-service':
              this._executeActionService(item);
              break;
            case 'more-info':
              this._executeActionMoreInfo(item);
              break;
            default:
              console.warn("MicroBadge: Unrecognized action:", item.action);
          }
        } catch (e) {
          console.error("MicroBadge: Error executing action:", item.action, e);
        }
    }

    protected _executeActionNavigate(item: IMicroBadgeConfig): void {
        if (item.navigation_path) {
            window.history.pushState(null, "", item.navigation_path);
            fireEvent(window, 'location-changed');
        } else {
            console.warn(`MicroBadge: No navigation path defined for item ${item.name}`, item);
        }
    }

    protected _executeActionUrl(item: IMicroBadgeConfig): void {
        if (item.url_path) {
          window.open(item.url_path, item.url_target || '_blank');
        } else {
          console.warn(`MicroBadge: URL action called without url_path for item ${item.name}`, item);
        }
    }

    protected _executeActionToggle(item: IMicroBadgeConfig): void {
        if (item.entity_id) {
          this.hass.callService('homeassistant', 'toggle', { entity_id: item.entity });
        } else {
          console.warn(`MicroBadge: Toggle action called without a valid entity_id for item ${item.name}`, item);
        }
    }

    protected _executeActionService(item: IMicroBadgeConfig): void {
        if (!item.service) {
          console.warn(`MicroBadge: Call-service action called without service defined for item ${item.name}`, item);
          return;
        }
        const [domain, service] = item.service.split('.', 2);
        if (!domain || !service) {
          console.warn("MicroBadge: Invalid service format:", item.service);
          return;
        }

        // Use service_data or data for compatibility
        const serviceData = item.service_data || item.data || {};

        // Target handling
        const target = item.target || (serviceData.entity_id ? { entity_id: serviceData.entity_id } : {});

        this.hass.callService(domain, service, serviceData, target);
    }

    protected _executeActionMoreInfo(item: IMicroBadgeConfig): void {
        const entityId = item.entity ?? item.entity_id;

        if (entityId) {
          fireEvent(this, 'hass-more-info', { entityId });
        } else {
          console.warn(`MicroBadge: More-info action called without a valid entity_id for item ${item.name}`, item);
        }
    }

    protected parseText(text: string): string {
        return text.replace(/\{\{\s*(.*?)\s*\}\}/g, (_match, entityId) => {
            if (entityId.toLowerCase().trim() === "user")
                return this.hass.user.name || "Utilisateur inconnu";
            else if (entityId.toLowerCase().trim() === "date")
                return this._sDate;
            else if (entityId.toLowerCase().trim() === "time")
                return this._sTime;
            else {
                const entity = this.hass.states[entityId];
                if (!entity) return '[Entité non trouvée]';
                return entity.state;
            }
        });
    }

    protected render(): TemplateResult | void {
        const entity = this.hass.states[this._config?.entity_id || ''];
        const entity_state = (!entity) ? '[Entité non trouvée]' : entity.state;
        const entity_unit = (!entity) ? '' : entity.attributes.unit_of_measurement;
        const entity_icon = (!entity) ? '' : entity.attributes.icon;

        const icon = this._config?.icon || entity_icon || 'mdi:information-outline';

        const styles = this._config?.styles ?? {};

        return html`
            <ha-card style="">
                <div class="micro-badge" style="${Object.entries(styles).map(([k, v]) => `${k}:${v}`).join(';')}" @click=${() => this._executeAction(this._config ?? {})}>
                    <span class="micro-badge-icon">
                        <ha-icon icon="${icon}"></ha-icon>
                    </span>
                    <span class="micro-badge-value">${entity_state} ${entity_unit}</span>
                </div>
            </ha-card>
        `;
    }

    static get styles(): CSSResult {
        return css`
            ha-card {
                background: transparent;
                border: none;
            }

            ha-icon {
                transform: translateY(-1px);
            }

            .micro-badge {
                --micro-badge-color: #d32f2f;
                --micro-badge-background-color: #ffffff;
                --micro-badge-icon-color: #ffffff;
                --micro-badge-text-color: #000000;
                --micro-badge-font-size: 14px;
                --mdc-icon-size: calc(var(--micro-badge-font-size) + 10px);
                display: inline-flex;
                align-items: center;
                border-radius: 999px;
                border: 2px solid var(--micro-badge-color);
                background-color: var(--micro-badge-color);
                overflow: hidden;
                font-family: sans-serif;
                font-size: var(--micro-badge-font-size);
            }

            .micro-badge-icon {
                background: var(--micro-badge-color);
                color: var(--micro-badge-icon-color);
                padding: 0 2px 0 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: calc(var(--micro-badge-font-size) + 4px);
            }

            .micro-badge-value {
                background: var(--micro-badge-background-color);
                color: var(--micro-badge-text-color);
                padding: 4px 8px;
                border-radius: 999px;
            }
        `;
    }

    static getStubConfig() {
        return {
            entity_id: "input_number.micro_badge_example",
            icon: "",
            action: "more-info"
        };
    }
}
