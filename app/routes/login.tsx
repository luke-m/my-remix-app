import { ActionFunction, json, Link, LinksFunction, useActionData, useSearchParams } from "remix";
import { db } from "~/utils/db.server";
import { checkForUser, createUserSession, login, register } from "~/utils/session.server";
import stylesUrl from '../styles/login.css';

type ActionData = {
    formError?: string;
    fieldErrors?: {
        username: string | undefined;
        password: string | undefined;
    }
    fields?: {
        username: string;
        password: string;
        loginType: string;
    }
}

export const links: LinksFunction = () => {
    return [{
        rel: 'stylesheet',
        href: stylesUrl,
    }]
}

const badRequest = (data: ActionData) => json(data, { status: 400 })

const validateUsername = (name: string) => {
    if (name.length < 3) {
        return 'Usernames must be at least 3 characters long';
    }
}

const validatePassword = (pw: string) => {
    if (pw.length < 6) {
        return 'Passwords must be at least 6 characters long'
    }
}

export const action: ActionFunction = async ({ request }) => {
    const formData = await request.formData();
    const loginType = formData.get('loginType') as 'login' | 'register';
    const username = formData.get('username');
    const password = formData.get('password');
    const redirectTo = formData.get('redirectTo') || '/jokes';

    if (
        typeof loginType !== 'string' ||
        typeof username !== 'string' ||
        typeof password !== 'string' ||
        typeof redirectTo !== 'string'
    ) {
        return badRequest({
            formError: 'Form submitted incorrectly',
        })
    }

    const fieldErrors = {
        username: validateUsername(username),
        password: validatePassword(password),
    };

    const fields = { loginType, username, password, redirectTo };

    if (Object.values(fieldErrors).some(Boolean)) {
        return badRequest({
            fields,
            fieldErrors
        })
    }

    switch (loginType) {
        case 'login': {
            const user = await login(username, password);

            if (!user) {
                return badRequest({
                    fields,
                    formError: 'Combination incorrect!'
                })
            }
            
            return createUserSession(user.id, redirectTo);
        };
        case 'register': {
            const user = await checkForUser(username);

            if (user) {
                return badRequest({
                    fields,
                    formError: `User ${username} already exists`,
                })
            } else {
                // create user
                return register(username, password, '/jokes');
            }
        };
        default: {
            return badRequest({
                fields,
                formError: 'Invalid login type'
            })
        }
    }
}

export default () => {

    const [searchParams] = useSearchParams();
    const actionData = useActionData<ActionData>();

    return (
        <div className="container">
            <div className="content" data-light="">
                <h1>Login</h1>
                <form method="post">
                    <input
                        type="hidden"
                        name="redirectTo"
                        value={
                            searchParams.get("redirectTo") ?? undefined
                        }
                    />
                    <fieldset>
                        <legend className="sr-only">
                            Login or Register?
                        </legend>
                        <label>
                            <input
                                type="radio"
                                name="loginType"
                                value="login"
                                defaultChecked={
                                    !actionData?.fields?.loginType ||
                                    actionData?.fields?.loginType === 'login'
                                }
                            />{" "}
                            Login
                        </label>
                        <label>
                            <input
                                type="radio"
                                name="loginType"
                                value="register"
                                defaultChecked={
                                    actionData?.fields?.loginType === 'register'
                                }
                            />{" "}
                            Register
                        </label>
                    </fieldset>
                    <div>
                        <label htmlFor="username-input">Username</label>
                        <input
                            type="text"
                            id="username-input"
                            name="username"
                            autoComplete="off"
                            defaultValue={actionData?.fields?.username ?? ''}
                        />
                        {actionData?.fieldErrors?.username && (
                            <p>{actionData.fieldErrors.username}</p>
                        )}
                    </div>
                    <div>
                        <label htmlFor="password-input">Password</label>
                        <input
                            id="password-input"
                            name="password"
                            type="password"
                            defaultValue={actionData?.fields?.password ?? ''}
                        />
                        {actionData?.fieldErrors?.password && (
                            <p>{actionData.fieldErrors.password}</p>
                        )}
                    </div>
                    {actionData?.formError && (
                        <div>
                            <p>{actionData.formError}</p>
                        </div>
                    )}
                    <button type="submit" className="button">
                        Submit
                    </button>
                </form>
            </div>
            <div className="links">
                <ul>
                    <li>
                        <Link to="/">Home</Link>
                    </li>
                    <li>
                        <Link to="/jokes">Jokes</Link>
                    </li>
                </ul>
            </div>
        </div>
    );
}