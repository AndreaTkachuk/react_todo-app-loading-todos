/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect } from 'react';
import { UserWarning } from './UserWarning';
import {
  getTodos,
  postTodo,
  removeTodo,
  renewTodo,
  USER_ID,
} from './api/todos';
import { Todo } from './types/Todo';
import classNames from 'classnames';

export const App: React.FC = () => {
  const [todos, setTodos] = React.useState<Todo[]>([]);
  const [title, setTitle] = React.useState('');
  const [filter, setFilter] = React.useState<'all' | 'active' | 'completed'>(
    'all',
  );
  const [editTitle, setEditTitle] = React.useState('');
  const leftItems = todos.filter(todo => !todo.completed).length;
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState<number | null>(null);
  const [isEditingId, setIsEditingId] = React.useState<number | null>(null);
  const showError = (message: string) => {
    setError(message);

    setTimeout(() => {
      setError('');
    }, 3000);
  };

  const allTodoCompleted = todos.every(todo => todo.completed);
  const getFilteredTodos = (): Todo[] => {
    switch (filter) {
      case 'active':
        return todos.filter(todo => !todo.completed);
      case 'completed':
        return todos.filter(todo => todo.completed);
      default:
        return todos;
    }
  };

  useEffect(() => {
    getTodos()
      .then(data => setTodos(data))
      .catch(() => showError('Unable to load todos'))
      .finally(() => setLoading(0));
  }, []);

  if (!USER_ID) {
    return <UserWarning />;
  }

  const handleInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(event.target.value);
    setError('');
  };

  const handleEditInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEditTitle(event.target.value);
    setError('');
  };

  const handleDoubleClick = (id: number, currentTitle: string) => {
    setIsEditingId(id);
    setEditTitle(currentTitle);
  };

  const addTodo = (event: React.FormEvent) => {
    event.preventDefault();

    if (!title) {
      showError('Title should not be empty');

      return;
    }

    setLoading(1);

    // Add a new todo
    postTodo(title)
      .then((newTodo: Todo) => {
        setTodos(prevTodos => [...prevTodos, newTodo]);
        setError('');
      })
      .catch(() => showError('Unable to add a todo'))
      .finally(() => {
        setLoading(0);
        setTitle('');
      });

    setTitle('');
  };

  const updateTodoCheck = (id: number) => {
    setLoading(id);

    const todoToUpdate = todos.find(todo => todo.id === id);

    if (!todoToUpdate) {
      setLoading(0);

      return;
    }

    const updatedTodo = {
      ...todoToUpdate,
      completed: !todoToUpdate.completed,
    };

    // Update a todo
    renewTodo(id, updatedTodo)
      .then(() => {
        setTodos(currentTodos =>
          currentTodos.map(todo =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo,
          ),
        );
        setLoading(0);
      })
      .catch(() => showError('Unable to update a todo'))
      .finally(() => setLoading(0));
  };

  const updateTodoTitle = (
    event: React.FormEvent,
    id: number,
    value: string,
  ) => {
    event.preventDefault();
    setLoading(id);

    const todoToUpdate = todos.find(todo => todo.id === id);

    if (!todoToUpdate) {
      setLoading(0);

      return;
    }

    const updatedTodo = {
      ...todoToUpdate,
      title: value,
    };

    // Update a todo
    renewTodo(id, updatedTodo)
      .then(() => {
        setTodos(currentTodos =>
          currentTodos.map(todo =>
            todo.id === id ? { ...todo, title: value } : todo,
          ),
        );
        setLoading(0);
      })
      .catch(() => showError('Unable to update a todo'))
      .finally(() => {
        setLoading(0);
        setIsEditingId(null);
        setEditTitle('');
      });
    // setEditTitle('');
  };

  const deleteTodo = (id: number) => {
    setLoading(id);

    // Remove a todo
    removeTodo(id)
      .then(() => setTodos(todos.filter(item => item.id !== id)))
      .catch(() => showError('Unable to delete a todo'))
      .finally(() => setLoading(0));
  };

  const clearCompleted = () => {
    const todosCompleted = todos.filter(todo => todo.completed);

    Promise.all(
      todosCompleted.map(todo => {
        setLoading(todo.id);
        removeTodo(todo.id);
      }),
    )
      .then(() => setTodos(todos.filter(todo => !todo.completed)))
      .catch(() => showError('Error'))
      .finally(() => setLoading(0));
  };

  const filteredTodos = getFilteredTodos();

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <header className="todoapp__header">
          {/* this button should have `active` class only if all todos are completed */}
          <button
            type="button"
            className={classNames('todoapp__toggle-all', {
              active: allTodoCompleted && todos.length > 0,
            })}
            // className="todoapp__toggle-all active"
            data-cy="ToggleAllButton"
            onClick={clearCompleted}
          />

          {/* Add a todo on form submit */}
          <form onSubmit={addTodo}>
            <input
              data-cy="NewTodoField"
              type="text"
              value={title}
              className="todoapp__new-todo"
              placeholder="What needs to be done?"
              onChange={handleInput}
            />
          </form>
        </header>

        <section className="todoapp__main" data-cy="TodoList">
          {filteredTodos.map(todo => (
            <div
              key={todo.id}
              data-cy="Todo"
              className={classNames('todo item-enter-done', {
                completed: todo.completed,
              })}
            >
              <label className="todo__status-label">
                <input
                  data-cy="TodoStatus"
                  type="checkbox"
                  className="todo__status"
                  checked={todo.completed}
                  onChange={() => updateTodoCheck(todo.id)}
                />
              </label>
              {isEditingId === todo.id ? (
                <form
                  onSubmit={event => updateTodoTitle(event, todo.id, editTitle)}
                >
                  <input
                    type="text"
                    // className="todo__active"
                    value={editTitle}
                    onBlur={event => updateTodoTitle(event, todo.id, editTitle)}
                    onChange={handleEditInput}
                    autoFocus
                  />
                </form>
              ) : (
                <span
                  data-cy="TodoTitle"
                  className="todo__title"
                  onDoubleClick={() => handleDoubleClick(todo.id, todo.title)}
                >
                  {todo.title}
                </span>
              )}
              {/* Remove button appears only on hover */}
              {isEditingId !== todo.id && (
                <button
                  type="button"
                  className="todo__remove"
                  data-cy="TodoDelete"
                  onClick={() => deleteTodo(todo.id)}
                >
                  ×
                </button>
              )}

              {/* overlay will cover the todo while it is being deleted or updated */}

              <div
                data-cy="TodoLoader"
                className={classNames('modal overlay', {
                  'is-active': loading === todo.id,
                })}
              >
                <div className="modal-background has-background-white-ter" />
                <div className="loader" />
              </div>
            </div>
          ))}
        </section>

        {/* Hide the footer if there are no todos */}
        {todos.length > 0 && (
          <footer className="todoapp__footer" data-cy="Footer">
            <span className="todo-count" data-cy="TodosCounter">
              {leftItems} items left
            </span>

            {/* Active link should have the 'selected' class */}
            <nav className="filter" data-cy="Filter">
              <a
                href="#/"
                className={classNames('filter__link', {
                  selected: filter === 'all',
                })}
                data-cy="FilterLinkAll"
                onClick={() => setFilter('all')}
              >
                All
              </a>

              <a
                href="#/active"
                className={classNames('filter__link', {
                  selected: filter === 'active',
                })}
                data-cy="FilterLinkActive"
                onClick={() => setFilter('active')}
              >
                Active
              </a>

              <a
                href="#/completed"
                className={classNames('filter__link', {
                  selected: filter === 'completed',
                })}
                data-cy="FilterLinkCompleted"
                onClick={() => setFilter('completed')}
              >
                Completed
              </a>
            </nav>

            {/* this button should be disabled if there are no completed todos */}
            <button
              type="button"
              className="todoapp__clear-completed"
              data-cy="ClearCompletedButton"
              onClick={clearCompleted}
              disabled={todos.every(todo => !todo.completed)}
            >
              Clear completed
            </button>
          </footer>
        )}
      </div>

      {/* DON'T use conditional rendering to hide the notification */}
      {/* Add the 'hidden' class to hide the message smoothly */}
      <div
        data-cy="ErrorNotification"
        className={classNames(
          'notification is-danger is-light has-text-weight-normal',
          { hidden: !error },
        )}
      >
        <button
          data-cy="HideErrorButton"
          type="button"
          className="delete"
          onClick={() => setError('')}
        />
        {/* show only one message at a time */}
        {error}
      </div>
    </div>
  );
};
