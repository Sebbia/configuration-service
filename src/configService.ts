////////////////////////////////////////////////////////////////////////////////
// Declarations

interface Value {
  asString(): string;
  asNumber(): number;
  asBoolean(): boolean;
  asPlainObject(): Record<string, any>;
  asBinary(): ArrayBuffer;
}

export type ValueConverter<T> = (v: Value) => T;

interface OptionDescriptor<T> {
  path: string;
  required: boolean;
  defaultValue?: T;
  converter: ValueConverter<T>;
}

interface ConfigurationService {
  get<T>(opt: OptionDescriptor<T>): T;
}

interface ConfigurationSource {
  get(path: string): Value | undefined;
}

////////////////////////////////////////////////////////////////////////////////
// Realization

class OptionGroup {
  constructor(private name: string, private parent?: OptionGroup) {}
  get path(): string {
    return [this.parent?.path, this.name].filter((d) => d).join('.');
  }
}

class ConfServiceImpl implements ConfigurationService {
  constructor(private sources: ConfigurationSource[]) {}

  private tryGetValue(path: string): Value | undefined {
    for (const source of this.sources) {
      const v = source.get(path);
      if (v) return v;
    }
    return undefined;
  }

  get<T>(opt: OptionDescriptor<T>): T {
    const v = this.tryGetValue(opt.path);
    const result = v ? opt.converter(v) : opt.defaultValue;
    if (opt.required && !result) throw new Error(`Option '${opt.path}' required`);
    return result as T;
  }
}

function defineRequiredOption<T>(props: {
  group?: OptionGroup | undefined;
  name: string;
  converter: ValueConverter<T>;
  defaultValue?: T;
}): OptionDescriptor<T> {
  return {
    path: [props.group?.path, props.name].filter((d) => d).join('.'),
    required: true,
    defaultValue: props.defaultValue,
    converter: props.converter,
  };
}

function stringConverter(v: Value): string {
  return v.asString();
}

interface Coordinate {
  lat: number;
  lng: number;
}

function coordinateConverter(v: Value): Coordinate {
  const o = v.asPlainObject();
  return {
    lat: o['lat'] as number,
    lng: o['lng'] as number,
  };
}

class EnvSource implements ConfigurationSource {
  get(path: string): Value | undefined {
    throw new Error("Method not implemented.");
  }
}

class WindowSource implements ConfigurationSource {
  get(path: string): Value | undefined {
    throw new Error("Method not implemented.");
  }
}

class RemoteSource implements ConfigurationSource {
  get(path: string): Value | undefined {
    throw new Error("Method not implemented.");
  }
}

////////////////////////////////////////////////////////////////////////////////
// Usage

const appGroup = new OptionGroup('app');

const titleOpt = defineRequiredOption({
  group: appGroup,
  name: 'title',
  defaultValue: 'Undefined app title',
  converter: stringConverter,
});

const coordOpt = defineRequiredOption<Coordinate>({
  group: appGroup,
  name: 'coord',
  converter: coordinateConverter,
});

const confService = new ConfServiceImpl([new RemoteSource(), new WindowSource(), new EnvSource()]);

const title = confService.get(titleOpt);
const coord = confService.get(coordOpt);

// React hook + RxJS
// const title = useConfigValue(confService, titleOpt);
