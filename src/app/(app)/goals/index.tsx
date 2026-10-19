import { router, Stack } from 'expo-router';

import {
	EmptyState,
	ErrorState,
	LoadingState,
} from '@/components/feedback/states';
import { GoalCard } from '@/components/finance/goal-card';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { useIsPro } from '@/features/pro/pro-store';
import { useGoals } from '@/hooks/use-app-data';

export default function GoalsScreen() {
	const query = useGoals();
	const isPro = useIsPro();
	const openEditor = () => router.push(isPro ? '/goals/edit' : '/pro');

	return (
		<>
			<Stack.Screen
				options={{
					headerRight: () => (
						<Button
							label='Add'
							variant='ghost'
							compact
							onPress={openEditor}
						/>
					),
				}}
			/>
			<Screen>
				{query.status === 'loading' ? <LoadingState /> : null}
				{query.status === 'error' ? (
					<ErrorState
						message='Goals could not be loaded.'
						onRetry={query.reload}
					/>
				) : null}
				{query.status === 'success' && query.goals.length === 0 ? (
					<EmptyState
						icon='goal'
						title='No savings goals'
						message='Set a target and record what you put aside. Goal contributions are tracked separately and do not change your balance.'
					/>
				) : null}
				{query.goals.map((progress) => (
					<GoalCard key={progress.goal.id} progress={progress} />
				))}
			</Screen>
		</>
	);
}
