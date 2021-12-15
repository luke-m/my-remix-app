import { ActionFunction, Link, Outlet, useCatch, useLoaderData } from "remix";
import { db } from '../utils/db.server';

import type { LinksFunction, LoaderFunction } from 'remix';
import type { Joke, User } from '@prisma/client';

import styleUrl from '../styles/jokes.css';
import { getUser } from "~/utils/session.server";

export const links: LinksFunction = () => {
    return [{ href: styleUrl, rel: 'stylesheet' }]
}

type LoaderData = { 
    jokes: Array<Pick<Joke, "id" | "name">>, 
    user: User | null 
}

export let loader: LoaderFunction = async ({request}) => {
    const data: LoaderData = {
        jokes: await db.joke.findMany({
            take: 5,
            orderBy: {
                createdAt: "desc"
            },
            select: {
                id: true,
                name: true,
            }
        }),
        user: await getUser(request),
    }

    return data
}

export default function JokesScreen() {
    const data = useLoaderData<LoaderData>();

    return (
        <div className="jokes-layout">
            <header className="jokes-header">
                <div className="container">
                    <h1 className="home-link">
                        <Link
                            to="/"
                            title="Remix Jokes"
                            aria-label="Remix Jokes"
                        >
                            <span className="logo">🤪</span>
                            <span className="logo-medium">J🤪KES</span>
                        </Link>
                    </h1>
                    {data.user ? (
                        <div className="user-info">
                            <span>{`Hi ${data.user.username}`}</span>
                            <form action="/logout" method="post">
                                <button type="submit" className="button">
                                    Logout
                                </button>
                            </form>
                        </div>
                    ) : (
                        <Link to={`/login`}>Login</Link>
                    )}
                </div>
            </header>
            <main className="jokes-main">
                <div className="container">
                    <div className="jokes-list">
                        <Link to=".">Get a random joke</Link>
                        <p>Here are a few more jokes to check out:</p>
                        <ul>
                            {data.jokes?.map(joke => <li key={joke.id}>
                                <Link to={joke.id}>{joke.name}</Link>
                            </li>)}
                        </ul>
                        <Link to="new" className="button">
                            Add your own
                        </Link>
                    </div>
                    <div className="jokes-outlet">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}

export function CatchBoundary() {
    const caught = useCatch();

    return (
        <div className="error-container">
            <h1>Sheesh</h1>
            <pre>{caught.data}</pre>
        </div>
    )
}

export function ErrorBoundary({error}: {error: Error}) {
    console.log(error);

    return (
        <div className="error-container">
            <h1>Shit happens</h1>
            <pre>{error.stack}</pre>
        </div>
    )
}