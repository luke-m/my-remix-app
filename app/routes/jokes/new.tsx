import { ActionFunction, json, Link, LoaderFunction, redirect, useActionData, useCatch } from "remix"
import { db } from "~/utils/db.server";
import { getUserId, requireUserId } from "~/utils/session.server";

type ActionData = {
    formError?: string;
    fieldErrors?: {
        name: string | undefined;
        content: string | undefined;
    },
    fields?: {
        name: string;
        content: string;
    }
}

const validateJokeContent = (content: string) => {
    if (content.length < 10) {
        return `That joke is too short`;
    }
}

const validateJokeName = (name: string) => {
    if (name.length < 2) {
        return `That joke's name is too short`;
    }
}

const badRequest = (data: ActionData) => json(data, { status: 400 });

export const loader: LoaderFunction = async ({
    request
}) => {
    const userId = await getUserId(request);

    if (!userId) {
        throw new Response("Unauthorized", {
            status: 401
        })
    }

    return {};
}

export const action: ActionFunction = async ({
    request: req
}) => {
    const form = await req.formData();
    const name = form.get("name");
    const content = form.get("content");
    const userId = await requireUserId(req) as string; 
    // userId will always be string unless redirect is thrown

    if (
        typeof name !== 'string' ||
        typeof content !== 'string'
    ) {
        return badRequest({
            formError: 'Form not submitted correctly'
        })
    }

    const fields = { name, content };

    const fieldErrors = {
        name: validateJokeName(name),
        content: validateJokeContent(content),
    }

    if (Object.values(fieldErrors).some(Boolean)) {
        return badRequest({ fieldErrors, fields })
    }

    const joke = await db.joke.create({
        data: {
            jokesterId: userId,
            ...fields
        },
    })

    return redirect(`/jokes/${joke.id}`);
};

export default () => {
    const actionData = useActionData<ActionData>();

    return (
        <div>
            <p>Add your own hilarious joke</p>
            <form method="post">
                <div>
                    <label>
                        Name:{" "}
                        <input
                            type="text"
                            defaultValue={actionData?.fields?.name}
                            name="name"
                            aria-invalid={
                                Boolean(actionData?.fieldErrors?.name) ||
                                undefined
                            }
                            aria-describedby={
                                actionData?.fieldErrors?.name
                                    ? "name-error"
                                    : undefined
                            }
                        />
                    </label>
                    {actionData?.fieldErrors?.name ? (
                        <p
                            className="form-validation-error"
                            role="alert"
                            id="name-error"
                        >
                            {actionData.fieldErrors.name}
                        </p>
                    ) : null}
                </div>
                <div>
                    <label>
                        Content:{" "}
                        <textarea
                            defaultValue={actionData?.fields?.content}
                            name="content"
                            aria-invalid={
                                Boolean(actionData?.fieldErrors?.content) ||
                                undefined
                            }
                            aria-describedby={
                                actionData?.fieldErrors?.content
                                    ? "content-error"
                                    : undefined
                            }
                        />
                    </label>
                    {actionData?.fieldErrors?.content ? (
                        <p
                            className="form-validation-error"
                            role="alert"
                            id="content-error"
                        >
                            {actionData.fieldErrors.content}
                        </p>
                    ) : null}
                </div>
                <div>
                    <button type="submit" className="button">
                        Add
                    </button>
                </div>
            </form>
        </div>
    );
}

export const ErrorBoundary = () => {
    return (
        <div className="error-container">
            Something unexpected went wrong.
        </div>
    )
}

export const CatchBoundary = () => {
    const caught = useCatch();

    if (caught.status === 401) {
        return (
            <div className="error-container">
                You must be logged in to create a new joke.

                <pre>{caught.status}</pre>

                <Link to="/login">Login</Link>
            </div>
        )
    }
}