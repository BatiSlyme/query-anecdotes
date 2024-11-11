import AnecdoteForm from './components/AnecdoteForm'
import Notification from './components/Notification'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useNotificationDispatch } from './NotificationContext'

const App = () => {
  const dispatch = useNotificationDispatch();

  const updateAnecdote = anecdote => {
    axios.put(`http://localhost:3001/anecdotes/${anecdote.id}`, anecdote).then(res => res.data);
  };

  const queryClient = useQueryClient();

  const newAnecdoteMutation = useMutation({
    mutationFn: (content) => { axios.post('http://localhost:3001/anecdotes', { content: content, votes: 0 }); console.log('creation called'); },
    onSuccess: () => {
      console.log('newAnecdoteMutation success');
      queryClient.invalidateQueries('anecdotes');
      queryClient.setQueriesData(['anecdotes'], [...anecdotes, { content: content, votes: 0 }]);
    }
  });

  const createAnecdote = (content) => {
    newAnecdoteMutation.mutate(content);
    dispatch({ type: 'CREATE', content });
    setTimeout(() => { dispatch({ type: 'CLEAR' }) }, 5000);
  }

  const updateAnecdoteMutation = useMutation({
    mutationFn: updateAnecdote,
    onSuccess: (anecdote) => {
      queryClient.invalidateQueries('anecdotes');
      queryClient.setQueriesData(['anecdotes'], anecdotes.map(a => a.id === anecdote.id ? anecdote : a));
    },
  });

  const result = useQuery({
    queryKey: ['anecdotes'],
    queryFn: () => axios.get('http://localhost:3001/anecdotes').then(res => res.data)
  });

  console.log(JSON.parse(JSON.stringify(result)))

  const handleVote = (anecdote) => {
    console.log('handleVote called', anecdote.id);
    updateAnecdoteMutation.mutate({ ...anecdote, votes: anecdote.votes + 1 });
    dispatch({ type: 'VOTE', anecdote });
    setTimeout(() => { dispatch({ type: 'CLEAR' }) }, 5000);
  }

  if (result.isLoading) {
    return <div>loading data...</div>
  }

  const anecdotes = result.data;
  console.log(anecdotes);

  return (
    <div>
      <h3>Anecdote app</h3>

      <Notification />
      <AnecdoteForm createAnecdote={createAnecdote} />

      {anecdotes.map(anecdote =>
        <div key={anecdote.id}>
          <div>
            {anecdote.content}
          </div>
          <div>
            has {anecdote.votes}
            <button onClick={() => handleVote(anecdote)}>vote</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
