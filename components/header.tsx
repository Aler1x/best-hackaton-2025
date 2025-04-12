"use client"
import Link from 'next/link';
import { Button } from './ui/button';
import Image from 'next/image';
import { MoonIcon, SunIcon, MonitorIcon, PawPrintIcon, HeartIcon, BellIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import LoginModal from '@/components/auth/login-modal';
import { useAuth } from '@/contexts/auth-context';
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuSeparator, navigationMenuTriggerStyle } from './ui/navigation-menu';

export default function Header() {
    const { theme, setTheme } = useTheme();
    const { user } = useAuth();

    const toggleTheme = () => {
        if (theme === 'dark') {
            setTheme('light');
        } else if (theme === 'light') {
            setTheme('system');
        } else {
            setTheme('dark');
        }
    };

    const renderThemeIcon = () => {
        switch (theme) {
            case 'dark':
                return <MoonIcon />;
            case 'light':
                return <SunIcon />;
            default:
                return <MonitorIcon />;
        }
    };

    return (
        <header className="sticky left-0 top-0 z-20 mx-auto flex h-[70px] w-full items-center justify-between border-b-4 border-border bg-secondary-background px-5">
            <section className="flex items-center gap-6">
                <Link href="/" className="text-main-foreground text-2xl font-bold flex items-center gap-2 dark:text-white">
                    <PawPrintIcon className="h-6 w-6" />
                    Best Shelter
                </Link>

                <div className="hidden md:flex items-center gap-6">
                    {user && (
                        <NavigationMenu>
                            <NavigationMenuList>
                                <NavigationMenuItem>
                                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                                        <Link href="/pets">Find Pets</Link>
                                    </NavigationMenuLink>
                                </NavigationMenuItem>
                                <NavigationMenuSeparator />
                                <NavigationMenuItem>
                                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                                        <Link href="/shelters">Shelters</Link>
                                    </NavigationMenuLink>
                                </NavigationMenuItem>
                            </NavigationMenuList>
                        </NavigationMenu>
                    )}
                </div>
            </section>

            <div className="flex items-center gap-2">
                <LoginModal />
                <Button onClick={toggleTheme} size="icon" variant="neutral">
                    {renderThemeIcon()}
                </Button>
            </div>

        </header>
    )
}
