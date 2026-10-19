const { withEntitlementsPlist } = require('expo/config-plugins');

function withLocalNotificationsOnly(config) {
	return withEntitlementsPlist(config, (config) => {
		delete config.modResults['aps-environment'];
		return config;
	});
}

module.exports = withLocalNotificationsOnly;
