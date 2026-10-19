const { withPodfile } = require('expo/config-plugins');

const MINIMUM_IOS_DEPLOYMENT_TARGET = '15.0';

function withMinimumIosDeploymentTarget(config) {
	return withPodfile(config, (config) => {
		if (config.modResults.includes(`IPHONEOS_DEPLOYMENT_TARGET'] = '${MINIMUM_IOS_DEPLOYMENT_TARGET}'`)) {
			return config;
		}

		const snippet = `
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |build_config|
        deployment_target = build_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET']
        if deployment_target.nil? || deployment_target.to_f < ${MINIMUM_IOS_DEPLOYMENT_TARGET}
          build_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${MINIMUM_IOS_DEPLOYMENT_TARGET}'
        end
      end
    end
`;

		config.modResults = config.modResults.replace(
			'post_install do |installer|\n',
			`post_install do |installer|\n${snippet}`,
		);
		return config;
	});
}

module.exports = withMinimumIosDeploymentTarget;
