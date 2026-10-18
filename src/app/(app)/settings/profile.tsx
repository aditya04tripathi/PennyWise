import { router } from 'expo-router';
import { useState } from 'react';

import { showMessage, userFacingError } from '@/components/feedback/confirm';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { updateSettings } from '@/features/settings/settings-service';
import { useSettings } from '@/hooks/use-app-data';

export default function ProfileScreen() {
	const settings = useSettings();
	const [name, setName] = useState(settings.name);
	const [saving, setSaving] = useState(false);

	const save = async () => {
		setSaving(true);
		try {
			await updateSettings({ name: name.trim() });
			router.back();
		} catch (error) {
			showMessage('Not saved', userFacingError(error));
		} finally {
			setSaving(false);
		}
	};

	return (
		<Screen>
			<TextField
				label='Name'
				value={name}
				onChangeText={setName}
				autoComplete='name'
				textContentType='name'
				maxLength={60}
				hint='Used only for the greeting on your overview.'
				onSubmitEditing={save}
				returnKeyType='done'
			/>
			<Button label='Save' onPress={save} loading={saving} fullWidth />
		</Screen>
	);
}
