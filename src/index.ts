import { Router } from 'itty-router'

declare const ALLOWED_ORIGIN: string
declare const STEAM_API_KEY: string

const allowedOrigin = new Set(ALLOWED_ORIGIN.split(',').map((o) => o.trim()))
const defaultOrigin = 'https://futa.moe'

const router = Router<Promise<Response>>()

const whitelistOrigin = (req: Request) => {
    const origin = req.headers.get('Origin')
    if (typeof origin === 'string' && !allowedOrigin.has(new URL(origin).hostname.toLowerCase())) {
        return new Response(
            JSON.stringify({
                code: 403,
                error: 'Origin is not allowed',
                error_hint: `Your origin is not whitelisted: ${origin || 'null'}`,
            }),
            { status: 403 },
        )
    }
}

router.all(
    '*',
    (req: Request) => {
        if (req.method !== 'OPTIONS') {
            return
        }

        return new Response(null, {
            headers: {
                'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
                'Access-Control-Allow-Origin': req.headers.get('Origin') || defaultOrigin,
            },
        })
    },
    whitelistOrigin,
)

router.get(
    '/getPlayerSummaries',
    async (req: Request) => {
        const url = new URL(req.url)
        const steamIds = url.searchParams.get('steamids') ?? ''

        if (steamIds.length === 0) {
            return new Response(
                JSON.stringify({
                    code: 404,
                    error: 'Missing parameters',
                    error_hint: "Don't send meaningless requests",
                }),
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    status: 400,
                },
            )
        }

        const proxiedUrl = new URL('https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/')
        proxiedUrl.searchParams.append('key', STEAM_API_KEY)
        proxiedUrl.searchParams.append('steamids', steamIds)

        const proxiedRequest = new Request(proxiedUrl.toString())
        proxiedRequest.headers.set('Origin', defaultOrigin)
        proxiedRequest.headers.set('Referer', new URL(defaultOrigin).toString())
        const proxiedResponse = await fetch(proxiedRequest)

        const response = new Response(proxiedResponse.body, proxiedResponse)
        response.headers.set('Access-Control-Allow-Origin', req.headers.get('Origin') || defaultOrigin)
        return response
    },
    whitelistOrigin,
)

router.all('*', () => {
    const message = 'Endpoint not found'
    return new Response(
        JSON.stringify({
            code: 404,
            error: message,
        }),
        {
            headers: {
                'Content-Type': 'application/json',
            },
            status: 404,
        },
    )
})

addEventListener('fetch', (event) => {
    event.respondWith(router.handle(event.request, event) as Response | Promise<Response>)
})
