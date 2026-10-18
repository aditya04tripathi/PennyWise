import { router, Stack } from 'expo-router';

import {
	EmptyState,
	ErrorState,
	LoadingState,
} from '@/components/feedback/states';
import { Button } from '@/components/ui/button';
import { GoalCard } from '@/components/finance/goal-card';
import { Screen } from '@/components/ui/screen';
import { useGoals } from '@/hooks/use-app-data';

export default function GoalsScreen() {
	const query = useGoals();
	const openEditor = () => router.push('/goals/edit');

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
						actionLabel='Add goal'
						onAction={openEditor}
					/>
				) : null}
				{query.goals.map((progress) => (
					<GoalCard key={progress.goal.id} progress={progress} />
				))}
			</Screen>
		</>
	);
}
