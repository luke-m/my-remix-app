import { useCatch, useLoaderData, useParams, ActionFunction, LoaderFunction, redirect, json, Form } from "remix";
import { db } from '../../utils/db.server';
import { Joke } from '@prisma/client';
import { requireUserId } from "~/utils/session.server";
import { JokeDisplay } from "~/components/joke";

type LoaderData = {
    joke: Joke;
    userId: string | null;
}


export const loader: LoaderFunction = async ({
    request,
    params
}) => {
    const joke = await db.joke.findUnique({
        where: {
            id: params.jokeId,
        }
    })

    if (!joke) {
        throw new Response("Not found!", {
            status: 404
        })
    }

    const userId = await requireUserId(request);

    const data: LoaderData = {
        joke,
        userId
    }

    return data;
}

export const action: ActionFunction = async ({
    params,
    request
}) => {
    const formData = await request.formData();

    if (formData.get('_method') === 'delete') {
        const { jokeId } = params;
        const userId = await requireUserId(request);
        const joke = await db.joke.findFirst({
            where: {
                id: jokeId,
            }
        })

        if (!joke) {
            throw new Response('Cant find that joke', {
                status: 404
            })
        }

        if (joke?.jokesterId !== userId) {
            throw new Response("This joke isn't yours to delete!", {
                status: 401
            })
        }

        try {
            await db.joke.delete({
                where: {
                    id: jokeId
                }
            })
        } catch (e) {
            console.log('============ caught error', e)
        }


        return redirect('/jokes');
    }
}

export default function JokesRoute() {
    const data = useLoaderData<LoaderData>();

    return (
        <div>
            <h2>{data?.joke?.name}</h2>
            <div>{data?.joke?.content}</div>

            {/* {data.joke?.jokesterId === data.userId ? ( */}
            {1 ? (
                <Form method="delete">
                    <input type="hidden" name="_method" value="delete" />
                    <button type="submit">Delete this joke</button>
                </Form>
            ) : null}
        </div>
    )

    // return (
    //     <JokeDisplay
    //         joke={data.joke}
    //         // isOwner={data.joke?.jokesterId === data.userId} 
    //         isOwner={true}
    //     />
    // );
}

export function CatchBoundary() {
    console.log('$jokeId.tsx CATCH BOUNDARY')
    let caught = useCatch();
    let params = useParams();
    switch (caught.status) {
        case 404: {
            return (
                <div className="error-container">
                    Huh? What the heck is {params.jokeId}?
                </div>
            );
        }
        case 401: {
            return (
                <div className="error-container">
                    Sorry, but {params.jokeId} is not your joke.
                </div>
            );
        }
        default: {
            throw new Error(`Unhandled error: ${caught.status}`);
        }
    }
}

export function ErrorBoundary({ error }: { error: Error }) {
    console.error(error);
    let { jokeId } = useParams();
    return (
        <div>{`There was an error loading joke by the id ${jokeId}. Sorry.`}</div>
    );
}
