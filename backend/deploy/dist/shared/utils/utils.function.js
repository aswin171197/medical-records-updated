"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsonToKeyValueString = jsonToKeyValueString;
function jsonToKeyValueString(obj) {
    if (typeof obj === 'string')
        return obj;
    const convertToKeyValue = (data, prefix = '') => {
        const result = [];
        if (typeof data === 'object' && data !== null) {
            for (const [key, value] of Object.entries(data)) {
                const newKey = prefix ? `${prefix}.${key}` : key;
                if (typeof value === 'object' && value !== null) {
                    result.push(...convertToKeyValue(value, newKey));
                }
                else {
                    result.push(`${newKey}: ${value}`);
                }
            }
        }
        else {
            result.push(`${prefix}: ${data}`);
        }
        return result;
    };
    return convertToKeyValue(obj).join('\n');
}
//# sourceMappingURL=utils.function.js.map