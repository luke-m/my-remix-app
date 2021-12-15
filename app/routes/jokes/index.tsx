import { Joke } from ".prisma/client";
import { LoaderFunction, useCatch, useLoaderData } from "remix"
import { db } from '../../utils/db.server';

type LoaderData = {
    randomJoke: Joke;
}

export const loader: LoaderFunction = async () => {
    const count = await db.joke.count();
    const random = Math.floor(Math.random() * count);
    const [randomJoke] = await db.joke.findMany({
        take: 1,
        skip: random,
    })

    if (!randomJoke) {
        throw new Response('No random joke found', {
            status: 404
        })
    }

    return {
        randomJoke
    }
}

export default () => {
    const data = useLoaderData<LoaderData>();

    return (
        <div>
            <h2>
                Here's a random joke:
            </h2>

            <p>{data.randomJoke?.content}</p>
        </div>
    )
}

export function CatchBoundary() {
    const caught = useCatch();

    if (caught.status === 404) {
        return (
            <div className="error-container">
                There are no jokes here...
            </div>
        )
    }

    throw new Error(`Unexpected caught response with status: ${caught.status}`)
}

export function ErrorBoundary() {
    return (
        <div className="error-container">
            I did a whoopsies.
        </div>
    );
}

