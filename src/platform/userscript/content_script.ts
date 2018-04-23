import I18nService from '../../localization/I18nService';
import UserscriptAlertController from './ui/UserscriptAlertController';
import UserscriptSettingsDao from './storage/UserscriptSettingsDao';
import UserscriptContentScriptApiFacade from './storage/UserscriptContentScriptApiFacade';
import adguard from '../../content_script_namespace';
import getMessage from './get_message';
import CSSService from '../../ui/controllers/utils/CssService';

const i18nService       = new I18nService(getMessage);
const settingsDao       = new UserscriptSettingsDao();
const cssService        = new CSSService(GM_getResourceURL);
const alertController   = new UserscriptAlertController(settingsDao, cssService);
const csApiFacade       = new UserscriptContentScriptApiFacade(settingsDao, alertController, getMessage);

adguard.i18nService = i18nService;

UserscriptSettingsDao.migrateDataIfNeeded();

RESOURCE_PAGE_SCRIPT;

const BRIDGE_KEY = csApiFacade.expose();

/**
 * In Firefox, userscripts can't write properties of unsafeWindow, so we
 * create a <script> tag to run the script in the page's context.
 */
if (csApiFacade.envIsFirefoxBrowserExt) {
    let script = document.createElement('script');
    let text = `(${popupBlocker.toString()})(this,!1,'${BRIDGE_KEY}')`;
    script.textContent = text;
    let el = document.body || document.head || document.documentElement;
    el.appendChild(script);
    el.removeChild(script);
} else {
    let win = typeof unsafeWindow !== 'undefined' ? unsafeWindow.window : window;
    popupBlocker(win, undefined, BRIDGE_KEY);
}

/**
 * Expose GM_api on options page.
 */
function isOptionsPage() {
    return location.href === 'https://adguardteam.github.io/PopupBlocker/options.html';
}

if (isOptionsPage()) {
    unsafeWindow["GM_getValue"] = exportFunction(GM_getValue, unsafeWindow);
    unsafeWindow["GM_setValue"] = exportFunction(GM_setValue, unsafeWindow);
    unsafeWindow["GM_listValues"] = exportFunction(GM_listValues, unsafeWindow);
}

declare var RESOURCE_PAGE_SCRIPT;
